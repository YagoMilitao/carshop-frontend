import type { Comment } from "@/lib/api/comments"
import type { Work } from "@/lib/api/works"

import { formatReviewerName } from "./format-reviewer-name"

/**
 * Quantos works (os primeiros da listagem, na ordem da API) têm seus
 * comentários aprovados consultados para a Home. Não há endpoint público
 * de comentários aprovados entre todos os works — a Home faz um fan-out
 * limitado sobre `GET /works/{workId}/comments` (decisão aprovada no
 * CARSHOP-170). Independente de `selectHomeWorks`.
 */
export const HOME_REVIEWS_WORKS_LIMIT = 6

/** Quantidade máxima de reviews exibidos em `#reviews`. */
export const HOME_REVIEWS_LIMIT = 3

/**
 * Review pronto para a UI. Não carrega `authorName`, `workId`, `status`
 * nem `updatedAt`: apenas o nome abreviado e o contexto real do work.
 */
export type HomeReview = {
  /** Apenas chave do React; não é renderizado. */
  id: string
  content: string
  reviewerName: string
  createdAt: string
  work: { title: string; slug: string }
}

/**
 * Seleção pura dos reviews da Home a partir dos comentários dos works
 * amostrados. "Mais recentes" é relativo a esses works (os
 * `HOME_REVIEWS_WORKS_LIMIT` primeiros), não ao site inteiro.
 *
 * Descarta: status diferente de `APPROVED` (filtro defensivo; o backend já
 * filtra), conteúdo vazio, `createdAt` inválido, nome derivado vazio, work
 * não resolvido na listagem e `id` duplicado. Ordena por `createdAt`
 * desc com desempate por `id` asc e limita a `HOME_REVIEWS_LIMIT`.
 */
export function selectHomeReviews(
  comments: readonly Comment[],
  works: readonly Work[],
): HomeReview[] {
  const worksById = new Map(works.map((work) => [work.id, work]))
  const seenIds = new Set<string>()
  const candidates: { review: HomeReview; timestamp: number }[] = []

  for (const comment of comments) {
    if (comment.status !== "APPROVED" || seenIds.has(comment.id)) {
      continue
    }

    const content = comment.content.trim()
    const timestamp = Date.parse(comment.createdAt)
    const reviewerName = formatReviewerName(comment.authorName)
    const work = worksById.get(comment.workId)

    if (
      content === "" ||
      Number.isNaN(timestamp) ||
      reviewerName === null ||
      work === undefined
    ) {
      continue
    }

    seenIds.add(comment.id)
    candidates.push({
      timestamp,
      review: {
        id: comment.id,
        content,
        reviewerName,
        createdAt: comment.createdAt,
        work: { title: work.title, slug: work.slug },
      },
    })
  }

  candidates.sort((a, b) => {
    if (a.timestamp !== b.timestamp) {
      return b.timestamp - a.timestamp
    }

    // `id`s já deduplicados: nunca iguais aqui.
    return a.review.id < b.review.id ? -1 : 1
  })

  return candidates
    .slice(0, HOME_REVIEWS_LIMIT)
    .map(({ review }) => review)
}
