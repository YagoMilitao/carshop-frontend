import { AxiosError, AxiosHeaders } from "axios";
import type { InternalAxiosRequestConfig } from "axios";
import { describe, expect, it } from "vitest";

import {
  getHomeImageErrorMessage,
  shouldRefreshHomeImageCandidates,
} from "./home-image-error";

function createAxiosError(status: number, message = "Mensagem do backend") {
  const config: InternalAxiosRequestConfig = { headers: new AxiosHeaders() };

  return new AxiosError(message, "ERR_BAD_REQUEST", config, undefined, {
    status,
    statusText: String(status),
    headers: new AxiosHeaders(),
    config,
    data: { message },
  });
}

const GENERIC = "Ocorreu um erro inesperado. Tente novamente.";

describe("getHomeImageErrorMessage", () => {
  it.each([
    [400, "Seleção inválida. Atualize a página e tente novamente."],
    [401, "Sua sessão expirou. Faça login novamente."],
    [404, "Imagem ou trabalho não encontrado. A lista foi atualizada."],
    [
      409,
      "Este trabalho não está mais publicado. A lista foi atualizada; escolha outra imagem.",
    ],
    [429, "Muitas tentativas. Aguarde alguns instantes e tente novamente."],
    [500, "Não foi possível salvar a imagem da Home. Tente novamente."],
  ])("mapeia o status %i para a mensagem da feature", (status, expected) => {
    expect(getHomeImageErrorMessage(createAxiosError(status))).toBe(expected);
  });

  it("usa a mensagem do backend para outros status", () => {
    expect(getHomeImageErrorMessage(createAxiosError(503, "Indisponível"))).toBe(
      "Indisponível",
    );
  });

  it("usa a mensagem genérica para erro de rede ou não-Axios", () => {
    expect(
      getHomeImageErrorMessage(new AxiosError("Network Error", "ERR_NETWORK")),
    ).toBe(GENERIC);
    expect(getHomeImageErrorMessage(new Error("boom"))).toBe(GENERIC);
    expect(getHomeImageErrorMessage(undefined)).toBe(GENERIC);
  });
});

describe("shouldRefreshHomeImageCandidates", () => {
  it.each([404, 409])("é true para %i", (status) => {
    expect(shouldRefreshHomeImageCandidates(createAxiosError(status))).toBe(true);
  });

  it.each([400, 401, 429, 500])("é false para %i", (status) => {
    expect(shouldRefreshHomeImageCandidates(createAxiosError(status))).toBe(
      false,
    );
  });

  it("é false para erros sem status ou não-Axios", () => {
    expect(
      shouldRefreshHomeImageCandidates(new AxiosError("Network Error")),
    ).toBe(false);
    expect(shouldRefreshHomeImageCandidates(new Error("404"))).toBe(false);
  });
});
