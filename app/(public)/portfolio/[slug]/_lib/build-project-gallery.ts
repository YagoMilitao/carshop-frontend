import type { Work, WorkImage } from "@/lib/api/works"
import { resolvePreviewImage } from "../../_lib/resolve-preview-image"

export type ProjectGalleryRole = "wide" | "narrow" | "solo"

export type ProjectGalleryEntry = {
  image: WorkImage
  role: ProjectGalleryRole
  /** Posição da imagem em `viewerImages` (lightbox). */
  viewerIndex: number
}

export type ProjectGalleryLayout = {
  hero: WorkImage | null
  entries: ProjectGalleryEntry[]
  /** Hero seguido da sequência, na mesma ordem de leitura da página. */
  viewerImages: WorkImage[]
}

const PAIR_ROLES: readonly (readonly [ProjectGalleryRole, ProjectGalleryRole])[] = [
  ["wide", "narrow"],
  ["narrow", "wide"],
]

/**
 * Composição editorial da galeria do detalhe (CARSHOP-146): a mesma
 * imagem da listagem (`resolvePreviewImage`) abre como hero; as demais
 * seguem por `order` em pares que alternam wide/narrow, e uma imagem sem
 * par fecha a sequência como `solo`. Função pura — não muta `work`.
 */
export function buildProjectGallery(work: Work): ProjectGalleryLayout {
  const hero = resolvePreviewImage(work)

  if (!hero) {
    return { hero: null, entries: [], viewerImages: [] }
  }

  // `Array.prototype.sort` é estável: `order` duplicado preserva a ordem da API.
  const rest = work.images
    .filter((image) => image.id !== hero.id)
    .sort((a, b) => a.order - b.order)

  const entries = rest.map((image, index): ProjectGalleryEntry => {
    const pairIndex = Math.floor(index / 2)
    const isUnpaired = index % 2 === 0 && index === rest.length - 1
    const role: ProjectGalleryRole = isUnpaired
      ? "solo"
      : PAIR_ROLES[pairIndex % 2][index % 2]

    return { image, role, viewerIndex: index + 1 }
  })

  return { hero, entries, viewerImages: [hero, ...rest] }
}
