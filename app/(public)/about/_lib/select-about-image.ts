import type { Work } from "@/lib/api/works"
import type { ProjectPreviewItem } from "../../_components/project-preview"
import { resolvePreviewImage } from "../../portfolio/_lib/resolve-preview-image"

/**
 * Foto real exibida no About (CARSHOP-147): o primeiro work, na ordem da
 * API, que tenha alguma imagem resolvível. Sem nenhum, `null` (a página
 * permanece apenas tipográfica).
 */
export function selectAboutImage(
  works: readonly Work[],
): ProjectPreviewItem | null {
  for (const work of works) {
    const image = resolvePreviewImage(work)

    if (image) {
      return { work, image }
    }
  }

  return null
}
