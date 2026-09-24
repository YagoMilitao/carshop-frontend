import { AxiosError } from "axios";

import { getApiErrorMessage } from "@/lib/api/auth.client";

// Mapeamento local à feature (mesmo padrão de `delete-work-image-error.ts`,
// CARSHOP-34): `getApiErrorMessage` não diferencia status HTTP, e o contrato
// de `/admin/comments` documenta 400/401/404/429 com feedbacks distintos.
export function getCommentModerationErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    switch (error.response?.status) {
      case 400:
        return "Dados inválidos. Revise os campos e tente novamente.";
      case 401:
        return "Sua sessão expirou. Faça login novamente.";
      case 404:
        return "Comentário não encontrado. Ele pode ter sido removido; a lista será atualizada.";
      case 429:
        return "Muitas tentativas. Aguarde alguns instantes e tente novamente.";
    }
  }

  return getApiErrorMessage(error);
}

export function isNotFoundError(error: unknown): boolean {
  return error instanceof AxiosError && error.response?.status === 404;
}
