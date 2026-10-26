import "server-only";

import { serverEnv } from "@/lib/env/server";
import { HttpError } from "./errors";
import { HOME_IMAGE_TAG, parseHomeImageResponse, type HomeImage } from "./home-image";
import { withRetryBackoff, type RetryOptions } from "./retry";

export type { HomeImage, HomeImageResponse } from "./home-image";

/**
 * Camada de acesso a dados server-side de `GET /home-image` (público, sem
 * auth), usada pela Home pública (Server Component). Usa `fetch` nativo —
 * nunca a instância Axios client-side (ADR-001).
 *
 * Sem `React.cache()`: hoje há um único chamador (`app/(public)/page.tsx`).
 * Um segundo chamador no mesmo request (ex. CARSHOP-162 ou
 * `generateMetadata`) deve envolver esta função em `cache()` — a
 * memoização nativa do `fetch` é desativada quando há `signal`.
 */

/**
 * Janela de revalidação (rede de segurança), em segundos. A invalidação
 * primária é por tag: `HOME_IMAGE_TAG` (salvar no Admin) e `"works"`
 * (exclusão/despublicação de work ou imagem também mudam a resposta).
 */
export const HOME_IMAGE_REVALIDATE_SECONDS = 300;

/** Limite de duração de cada tentativa individual de `GET /home-image`. */
export const HOME_IMAGE_REQUEST_TIMEOUT_MS = 5_000;

/**
 * Desvio deliberado do orçamento padrão de retry do ADR-019 (4 retries):
 * a imagem da Home é um dado secundário, com degradação em runtime para o
 * fallback, e está no caminho crítico do render da Home. O Data Cache não
 * armazena respostas não-`200`, então o orçamento completo poderia somar
 * ~7.5s de backoff a cada render com falha. O utilitário de retry, o
 * `HttpError` e a classificação de erros permanecem inalterados.
 */
export const HOME_IMAGE_RETRY_OPTIONS = {
  retries: 1,
  baseDelayMs: 500,
} as const satisfies RetryOptions;

/**
 * Busca a imagem principal configurada no Admin. Retorna `null` quando
 * nada está configurado/elegível ou o corpo é malformado; lança
 * `HttpError` (ou erro de rede/timeout) em falhas — o chamador degrada.
 */
export async function getHomeImage(): Promise<HomeImage | null> {
  return withRetryBackoff(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      HOME_IMAGE_REQUEST_TIMEOUT_MS,
    );

    try {
      const response = await fetch(`${serverEnv.apiUrl}/home-image`, {
        // Signal novo por tentativa (mesmo padrão de `getWorks`).
        signal: controller.signal,
        next: {
          revalidate: HOME_IMAGE_REVALIDATE_SECONDS,
          tags: [HOME_IMAGE_TAG, "works"],
        },
      });

      if (!response.ok) {
        throw new HttpError(
          `Falha ao buscar a imagem da Home: ${response.status}`,
          response.status,
        );
      }

      const payload: unknown = await response.json();

      return parseHomeImageResponse(payload);
    } finally {
      clearTimeout(timeoutId);
    }
  }, HOME_IMAGE_RETRY_OPTIONS);
}
