import type { HomeImage } from "@/lib/api/home-image"
import { getCoverImage, type Work, type WorkImage } from "@/lib/api/works"

import { isAllowedRemoteImageUrl } from "./is-allowed-remote-image-url"

export type HomeWork = {
  work: Work
  image: WorkImage
}

/** Subconjunto de imagem que o Hero precisa (comum a `WorkImage` e `HomeImage`). */
export type HomeHeroImage = Pick<WorkImage, "url" | "alt">

/**
 * Conteúdo do Hero. `work` é `null` quando a imagem configurada no Admin
 * não pôde ser associada a um work da listagem (sem legenda/link).
 */
export type HomeHeroContent = {
  image: HomeHeroImage
  work: Work | null
}

export type HomeWorksSelection = {
  hero: HomeHeroContent | null
  featured: HomeWork[]
}

const FEATURED_LIMIT = 3

/**
 * Seleção determinística dos works exibidos na Home (CARSHOP-144/161).
 *
 * - Fonte primária do Hero: a imagem configurada no Admin
 *   (`GET /home-image`), quando presente e servível por `next/image`. O
 *   work de origem é resolvido por `workId` na listagem já buscada e
 *   excluído de "Our Work" (o Hero nunca é repetido).
 * - Fallback (imagem `null`, falha ou host não permitido): o primeiro work
 *   com capa, na ordem da API, vira o Hero; os próximos (até 3) compõem
 *   "Our Work". Sem nenhum work com capa, o Hero é tipográfico.
 */
export function selectHomeWorks(
  works: readonly Work[],
  homeImage: HomeImage | null = null,
): HomeWorksSelection {
  const withCover: HomeWork[] = []

  for (const work of works) {
    const image = getCoverImage(work)

    if (image) {
      withCover.push({ work, image })
    }
  }

  const configured = homeImage && isAllowedRemoteImageUrl(homeImage.url) ? homeImage : null

  if (configured) {
    return {
      hero: {
        image: { url: configured.url, alt: configured.alt },
        work: works.find((work) => work.id === configured.workId) ?? null,
      },
      featured: withCover
        .filter((item) => item.work.id !== configured.workId)
        .slice(0, FEATURED_LIMIT),
    }
  }

  const first = withCover[0]

  return {
    hero: first ? { image: first.image, work: first.work } : null,
    featured: withCover.slice(1, 1 + FEATURED_LIMIT),
  }
}
