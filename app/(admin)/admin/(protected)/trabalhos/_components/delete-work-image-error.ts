import { AxiosError } from "axios";

import { getApiErrorMessage } from "@/lib/api/auth.client";

// Mapeamento local à feature (CARSHOP-34): `getApiErrorMessage` não
// diferencia status HTTP, e o contrato de
// `DELETE /admin/works/{workId}/images/{imageId}` documenta 401/404/429/500
// com feedbacks distintos. O comportamento global não é alterado.
export function getDeleteWorkImageErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    switch (error.response?.status) {
      case 401:
        return "Sua sessão expirou. Faça login novamente.";
      case 404:
        return "Imagem ou trabalho não encontrado. Feche este aviso para atualizar a lista.";
      case 429:
        return "Muitas tentativas. Aguarde alguns instantes e tente novamente.";
      case 500:
        return "Não foi possível remover a imagem. Tente novamente.";
    }
  }

  return getApiErrorMessage(error);
}
