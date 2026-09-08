import { AxiosError } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * `lib/api/auth.client.ts` usa a instância `http` (Axios) de
 * `lib/api/http.ts` — mockada aqui para isolar a lógica deste módulo (não
 * uma chamada de rede real). `AxiosError` real é reaproveitado (não
 * mockado) para exercitar `getApiErrorMessage()` fielmente.
 */
const postMock = vi.fn();
const getMock = vi.fn();

vi.mock("@/lib/api/http", () => ({
  http: {
    post: (...args: unknown[]) => postMock(...args),
    get: (...args: unknown[]) => getMock(...args),
  },
}));

import {
  getApiErrorMessage,
  getSession,
  login,
  logout,
  refresh,
} from "./auth.client";

describe("lib/api/auth.client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("login", () => {
    it("chama POST /auth/login com o payload e retorna os dados da resposta", async () => {
      const authSession = {
        accessToken: "token-1",
        user: { id: "1", email: "a@a.com", name: "A" },
      };
      postMock.mockResolvedValue({ data: authSession });

      const result = await login({ email: "a@a.com", password: "123456" });

      expect(postMock).toHaveBeenCalledWith("/auth/login", {
        email: "a@a.com",
        password: "123456",
      });
      expect(result).toEqual(authSession);
    });
  });

  describe("refresh", () => {
    it("chama POST /auth/refresh sem payload e retorna os dados da resposta", async () => {
      const authSession = {
        accessToken: "token-2",
        user: { id: "1", email: "a@a.com", name: "A" },
      };
      postMock.mockResolvedValue({ data: authSession });

      const result = await refresh();

      expect(postMock).toHaveBeenCalledWith("/auth/refresh");
      expect(result).toEqual(authSession);
    });
  });

  describe("logout", () => {
    it("chama POST /auth/logout", async () => {
      postMock.mockResolvedValue({ data: undefined });

      await logout();

      expect(postMock).toHaveBeenCalledWith("/auth/logout");
    });
  });

  describe("getSession", () => {
    it("chama GET /auth/session e retorna os dados da resposta", async () => {
      const session = { user: { id: "1", email: "a@a.com", name: "A" } };
      getMock.mockResolvedValue({ data: session });

      const result = await getSession();

      expect(getMock).toHaveBeenCalledWith("/auth/session");
      expect(result).toEqual(session);
    });
  });

  describe("getApiErrorMessage", () => {
    it("retorna a mensagem do corpo de erro da API quando presente (AxiosError)", () => {
      const error = new AxiosError("Bad Request", "ERR_BAD_REQUEST", undefined, undefined, {
        status: 400,
        statusText: "Bad Request",
        headers: {},
        config: {} as never,
        data: { message: "Credenciais inválidas." },
      });

      expect(getApiErrorMessage(error)).toBe("Credenciais inválidas.");
    });

    it("retorna mensagem genérica quando o AxiosError não tem body.message", () => {
      const error = new AxiosError("Bad Request", "ERR_BAD_REQUEST", undefined, undefined, {
        status: 400,
        statusText: "Bad Request",
        headers: {},
        config: {} as never,
        data: {},
      });

      expect(getApiErrorMessage(error)).toBe(
        "Ocorreu um erro inesperado. Tente novamente.",
      );
    });

    it("retorna mensagem genérica quando o erro não é um AxiosError", () => {
      expect(getApiErrorMessage(new Error("qualquer coisa"))).toBe(
        "Ocorreu um erro inesperado. Tente novamente.",
      );
      expect(getApiErrorMessage("string qualquer")).toBe(
        "Ocorreu um erro inesperado. Tente novamente.",
      );
    });
  });
});
