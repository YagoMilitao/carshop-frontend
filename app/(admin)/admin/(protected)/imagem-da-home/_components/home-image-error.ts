import { AxiosError } from "axios";

import { getApiErrorMessage } from "@/lib/api/auth.client";

// Mapeamento local à feature (mesmo padrão de `comment-moderation-error.ts`):
// o contrato de `PATCH /admin/home-image` (CARSHOP-159) documenta
// 400/401/404/409/429/500 com feedbacks distintos.
export function getHomeImageErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    switch (error.response?.status) {
      case 400:
        return "Seleção inválida. Atualize a página e tente novamente.";
      case 401:
        return "Sua sessão expirou. Faça login novamente.";
      case 404:
        return "Imagem ou trabalho não encontrado. A lista foi atualizada.";
      case 409:
        return "Este trabalho não está mais publicado. A lista foi atualizada; escolha outra imagem.";
      case 429:
        return "Muitas tentativas. Aguarde alguns instantes e tente novamente.";
      case 500:
        return "Não foi possível salvar a imagem da Home. Tente novamente.";
    }
  }

  return getApiErrorMessage(error);
}

/** 404/409 indicam candidatas desatualizadas: a lista deve ser recarregada. */
export function shouldRefreshHomeImageCandidates(error: unknown): boolean {
  if (!(error instanceof AxiosError)) {
    return false;
  }

  const status = error.response?.status;

  return status === 404 || status === 409;
}
