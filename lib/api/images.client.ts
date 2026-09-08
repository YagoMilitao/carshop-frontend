import { http } from "@/lib/api/http";
import type { WorkImage } from "@/lib/api/works";

/**
 * Camada de acesso a dados de mutações admin de `WorkImage` (Axios,
 * upload multipart). Limite de 5MB e tipos `JPEG/PNG/WebP` são validados
 * no formulário/UI antes do envio (UX) — o backend é a fonte de verdade
 * final da validação.
 */

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

export const ACCEPTED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

/** `POST /admin/works/:workId/images` (admin, autenticado, multipart). */
export async function uploadWorkImage(
  workId: string,
  file: File,
): Promise<WorkImage> {
  const formData = new FormData();
  formData.append("image", file);

  const response = await http.post<WorkImage>(
    `/admin/works/${workId}/images`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );

  return response.data;
}

/** `DELETE /admin/works/:workId/images/:imageId` (admin, autenticado). */
export async function deleteWorkImage(
  workId: string,
  imageId: string,
): Promise<void> {
  await http.delete(`/admin/works/${workId}/images/${imageId}`);
}
