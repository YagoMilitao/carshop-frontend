import "server-only"

import { getWorkComments, type Comment } from "@/lib/api/comments"
import { HttpError } from "@/lib/api/errors"
import type { RetryOptions } from "@/lib/api/retry"
import type { Work } from "@/lib/api/works"

import {
  HOME_REVIEWS_WORKS_LIMIT,
  selectHomeReviews,
  type HomeReview,
} from "./select-home-reviews"

/** Limite de duração de cada tentativa de `GET /works/{workId}/comments` na Home. */
export const HOME_REVIEWS_REQUEST_TIMEOUT_MS = 5_000

/**
 * Regra de retry da Home: repete apenas em `5xx` e em erro de rede/timeout
 * (sem `HttpError`). Diferente do default de `withRetryBackoff`, NÃO repete
 * em `429`: o rate limit do backend é global por IP (100 req/15min) e todas
 * as chamadas server-side do frontend compartilham o IP do servidor; repetir
 * em 500ms não tem como passar dentro de uma janela de 15min e só consome o
 * orçamento que também atende as demais páginas SSR. Outros `4xx` também
 * não são repetidos.
 */
function shouldRetryHomeReviews(error: unknown): boolean {
  if (error instanceof HttpError) {
    return error.status >= 500
  }

  return true
}

/**
 * Desvio deliberado do orçamento padrão de retry do ADR-019 (4 retries),
 * no mesmo espírito de `HOME_IMAGE_RETRY_OPTIONS`: os reviews são um dado
 * secundário da Home, com degradação silenciosa (seção omitida), e estão
 * no caminho crítico do render. O Data Cache não armazena respostas
 * não-`200`, então o orçamento completo somaria até ~7.5s de backoff por
 * work a cada render com falha.
 *
 * Pior caso por revalidação: 1 (`GET /works`) + até 6 requisições de
 * comentários (mais uma nova tentativa por work apenas em `5xx`/rede). Um
 * `429` omite somente aquele work, sem retry; como o Data Cache não guarda
 * respostas não-`200`, a próxima janela de ISR tenta de novo. O
 * `/portfolio/[slug]` não usa estas opções e mantém o orçamento padrão do
 * ADR-019.
 */
export const HOME_REVIEWS_RETRY_OPTIONS = {
  retries: 1,
  baseDelayMs: 500,
  shouldRetry: shouldRetryHomeReviews,
} as const satisfies RetryOptions

/**
 * Reviews da Home (`#reviews`) via fan-out limitado sobre o contrato
 * público existente: `GET /works/{workId}/comments` para os
 * `HOME_REVIEWS_WORKS_LIMIT` primeiros works já buscados pela Home. Não há
 * endpoint público de comentários aprovados entre todos os works; um
 * endpoint dedicado no backend é um possível follow-up, não inventado aqui.
 *
 * Nunca rejeita: cada falha por work é registrada (apenas `workId` + erro,
 * nunca nome/conteúdo) e ignorada; falha total, ausência de comentários ou
 * `works` vazio resultam em `[]`, e a seção é omitida — inclusive a âncora
 * `#reviews` (impacto a considerar no CARSHOP-162).
 *
 * Limitações conhecidas (aceitas):
 * - `429` não é repetido (ver `HOME_REVIEWS_RETRY_OPTIONS`). O orçamento de
 *   rate limit é compartilhado por todos os fetches server-side do IP do
 *   frontend; a contagem correta por cliente depende de `TRUST_PROXY_HOPS`
 *   estar configurado corretamente no backend (Render) — preocupação de
 *   backend/infra, não verificável a partir do frontend.
 * - A invalidação da tag `work-comments-{id}` só ocorre pelas Server Actions
 *   do admin do frontend; moderação feita fora dele (Swagger, Postman, outros
 *   clientes) aparece após até 300s (TTL de `revalidate`).
 * - Comportamento pré-existente do backend, fora do escopo da Home:
 *   `GET /works/{workId}/comments` só verifica se o work não foi excluído, não
 *   se está publicado — comentários aprovados de um rascunho são legíveis por
 *   quem souber o ID. A Home não é afetada: o `GET /works` público (sem
 *   `includeDrafts`) retorna apenas works publicados e não excluídos.
 *   Possível follow-up de backend.
 */
export async function getHomeReviews(
  works: readonly Work[],
): Promise<HomeReview[]> {
  const sampled = works.slice(0, HOME_REVIEWS_WORKS_LIMIT)

  if (sampled.length === 0) {
    return []
  }

  const results = await Promise.allSettled(
    sampled.map((work) =>
      getWorkComments(work.id, {
        retry: HOME_REVIEWS_RETRY_OPTIONS,
        timeoutMs: HOME_REVIEWS_REQUEST_TIMEOUT_MS,
      }),
    ),
  )

  const comments: Comment[] = []

  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      // Guarda de runtime: um corpo fora do contrato (não-array) não pode
      // quebrar o render da Home.
      if (Array.isArray(result.value)) {
        comments.push(...result.value)
      }
      return
    }

    console.error(
      "Falha ao buscar comentários de um work na Home:",
      sampled[index]?.id,
      result.reason,
    )
  })

  try {
    return selectHomeReviews(comments, sampled)
  } catch (error) {
    // Corpo fora do contrato (ex. campos ausentes): degrada sem quebrar a Home.
    console.error("Falha ao selecionar os reviews da Home:", error)
    return []
  }
}
