import { AxiosError, AxiosHeaders } from "axios";
import type { InternalAxiosRequestConfig } from "axios";
import { describe, expect, it } from "vitest";

import {
  getCommentModerationErrorMessage,
  isNotFoundError,
} from "./comment-moderation-error";

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

describe("getCommentModerationErrorMessage", () => {
  it.each([
    [400, "Dados inválidos. Revise os campos e tente novamente."],
    [401, "Sua sessão expirou. Faça login novamente."],
    [
      404,
      "Comentário não encontrado. Ele pode ter sido removido; a lista será atualizada.",
    ],
    [429, "Muitas tentativas. Aguarde alguns instantes e tente novamente."],
  ])("mapeia o status %i para a mensagem da feature", (status, expected) => {
    expect(getCommentModerationErrorMessage(createAxiosError(status))).toBe(
      expected,
    );
  });

  it("usa a mensagem do backend para outros status", () => {
    expect(
      getCommentModerationErrorMessage(createAxiosError(500, "Falha interna")),
    ).toBe("Falha interna");
  });

  it("usa a mensagem genérica para erro Axios sem response", () => {
    expect(
      getCommentModerationErrorMessage(
        new AxiosError("Network Error", "ERR_NETWORK"),
      ),
    ).toBe(GENERIC);
  });

  it("usa a mensagem genérica para erro que não é Axios", () => {
    expect(getCommentModerationErrorMessage(new Error("boom"))).toBe(GENERIC);
    expect(getCommentModerationErrorMessage("falha")).toBe(GENERIC);
  });
});

describe("isNotFoundError", () => {
  it("é true apenas para AxiosError 404", () => {
    expect(isNotFoundError(createAxiosError(404))).toBe(true);
    expect(isNotFoundError(createAxiosError(400))).toBe(false);
    expect(isNotFoundError(new AxiosError("Network Error"))).toBe(false);
    expect(isNotFoundError(new Error("404"))).toBe(false);
    expect(isNotFoundError(undefined)).toBe(false);
  });
});
