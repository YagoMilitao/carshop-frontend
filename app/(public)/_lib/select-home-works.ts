import { getCoverImage, type Work, type WorkImage } from "@/lib/api/works"

export type HomeWork = {
  work: Work
  image: WorkImage
}

export type HomeWorksSelection = {
  hero: HomeWork | null
  featured: HomeWork[]
}

const FEATURED_LIMIT = 3

/**
 * Seleção determinística dos works exibidos na Home (CARSHOP-144).
 *
 * O contrato de `GET /works` não expõe campo de destaque nem ordenação por
 * relevância, então a regra usa apenas dados reais: works com imagem de
 * capa, na ordem retornada pela API. O primeiro vira o Hero; os próximos
 * (até 3) compõem "Our Work" — o Hero nunca é repetido.
 */
export function selectHomeWorks(works: readonly Work[]): HomeWorksSelection {
  const withCover: HomeWork[] = []

  for (const work of works) {
    const image = getCoverImage(work)

    if (image) {
      withCover.push({ work, image })
    }
  }

  return {
    hero: withCover[0] ?? null,
    featured: withCover.slice(1, 1 + FEATURED_LIMIT),
  }
}
