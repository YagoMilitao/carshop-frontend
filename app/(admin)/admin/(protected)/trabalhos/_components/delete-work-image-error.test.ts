import { AxiosError, AxiosHeaders } from "axios";
import type { InternalAxiosRequestConfig } from "axios";
import { describe, expect, it } from "vitest";

import { getDeleteWorkImageErrorMessage } from "./delete-work-image-error";

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

describe("getDeleteWorkImageErrorMessage", () => {
  it.each([
    [401, "Sua sessão expirou. Faça login novamente."],
    [404, "Imagem ou trabalho não encontrado. A lista foi atualizada."],
    [429, "Muitas tentativas. Aguarde alguns instantes e tente novamente."],
    [500, "Não foi possível remover a imagem. Tente novamente."],
  ])("mapeia o status %i para a mensagem da feature", (status, expected) => {
    expect(getDeleteWorkImageErrorMessage(createAxiosError(status))).toBe(
      expected,
    );
  });

  it("usa a mensagem do backend para outros status", () => {
    expect(
      getDeleteWorkImageErrorMessage(createAxiosError(400, "Requisição inválida")),
    ).toBe("Requisição inválida");
  });

  it("usa a mensagem genérica para erro Axios sem response", () => {
    const error = new AxiosError("Network Error", "ERR_NETWORK");

    expect(getDeleteWorkImageErrorMessage(error)).toBe(
      "Ocorreu um erro inesperado. Tente novamente.",
    );
  });

  it("usa a mensagem genérica para erro que não é Axios", () => {
    expect(getDeleteWorkImageErrorMessage(new Error("boom"))).toBe(
      "Ocorreu um erro inesperado. Tente novamente.",
    );
    expect(getDeleteWorkImageErrorMessage("falha")).toBe(
      "Ocorreu um erro inesperado. Tente novamente.",
    );
  });
});
