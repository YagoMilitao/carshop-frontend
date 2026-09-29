import { http } from "@/lib/api/http";
import type { HomeImage, HomeImageResponse } from "@/lib/api/home-image";

/**
 * Acesso client-side à imagem principal da Home (Axios, instância única de
 * `lib/api/http.ts` — ADR-001). Contrato: CARSHOP-159.
 */

export const homeImageQueryKey = ["home-image"] as const;

/**
 * Referência a uma imagem já gerenciada pelo sistema. O backend rejeita
 * (400) qualquer campo extra — inclusive `url`.
 */
export type SetHomeImagePayload = {
  workId: string;
  imageId: string;
};

/** `GET /home-image` (público). */
export async function getHomeImage(): Promise<HomeImage | null> {
  const response = await http.get<HomeImageResponse>("/home-image");

  return response.data.image;
}

/** `PATCH /admin/home-image` (admin, autenticado). */
export async function setHomeImage(
  payload: SetHomeImagePayload,
): Promise<HomeImage> {
  // Body montado campo a campo (nunca spread): um objeto mais largo em
  // runtime não pode vazar campos extras, que o contrato rejeita com 400.
  const response = await http.patch<HomeImageResponse>("/admin/home-image", {
    workId: payload.workId,
    imageId: payload.imageId,
  });

  const { image } = response.data;

  if (image === null) {
    throw new Error("Resposta inválida: imagem da Home ausente após salvar.");
  }

  return image;
}
