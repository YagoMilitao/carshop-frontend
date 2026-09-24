import { getCoverImage, type Work, type WorkImage } from "@/lib/api/works"

/**
 * Imagem exibida no preview da listagem `/portfolio` (CARSHOP-145).
 *
 * Resolvido apenas na apresentação, sem alterar `getCoverImage`: a capa
 * (`isCover`) tem preferência; sem capa, usa a imagem de menor `order`;
 * sem nenhuma imagem, `null` (o work vira uma entrada somente texto).
 */
export function resolvePreviewImage(work: Work): WorkImage | null {
  const cover = getCoverImage(work)

  if (cover) {
    return cover
  }

  let first: WorkImage | null = null

  for (const image of work.images) {
    if (!first || image.order < first.order) {
      first = image
    }
  }

  return first
}
