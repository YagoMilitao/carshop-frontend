import type { Work } from "@/lib/api/works"
import { resolvePreviewImage } from "../portfolio/_lib/resolve-preview-image"
import type { HomeWork, HomeWorksSelection } from "./select-home-works"

/**
 * Foto real exibida em `#about` na Home (CARSHOP-169): o primeiro work, na
 * ordem da API, que não esteja no Hero nem em "Our Work" e tenha alguma
 * imagem resolvível (capa preferida). A exclusão é por work, não por
 * imagem. Sem candidato, `null` (a seção permanece apenas tipográfica).
 */
export function selectHomeAboutImage(
  works: readonly Work[],
  selection: HomeWorksSelection,
): HomeWork | null {
  const excluded = new Set<string>()

  const heroWorkId = selection.hero?.work?.id
  if (heroWorkId) {
    excluded.add(heroWorkId)
  }

  for (const item of selection.featured) {
    excluded.add(item.work.id)
  }

  for (const work of works) {
    if (excluded.has(work.id)) {
      continue
    }

    const image = resolvePreviewImage(work)

    if (image) {
      return { work, image }
    }
  }

  return null
}
