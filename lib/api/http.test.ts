import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AxiosError, AxiosHeaders } from "axios";
import type { InternalAxiosRequestConfig } from "axios";

/**
 * `lib/api/http.ts` lê `clientEnv` no top-level (fail-fast), que por sua
 * vez exige `NEXT_PUBLIC_API_URL` e `NEXT_PUBLIC_SITE_URL`. Usamos import
 * dinâmico + `vi.resetModules()` para isolar cada teste do estado
 * module-level do `http.ts` (accessToken, authFailureCallback,
 * refreshPromise), mesmo padrão de `lib/env/client.test.ts`.
 *
 * `refresh()` é mockado via `vi.mock("./auth.client")` para não depender
 * do módulo real (que por sua vez importa `http` de volta — ciclo
 * intencional documentado em `http.ts`). Nenhuma chamada de rede real.
 */

const refreshMock = vi.fn();

vi.mock("./auth.client", () => ({
  refresh: () => refreshMock(),
}));

/**
 * `http.interceptors.request/response.handlers` não faz parte do tipo
 * público do Axios, mas é o único jeito de invocar o handler registrado
 * diretamente, sem golpear a rede via `http(config)` (que captura a
 * função bound no momento da criação da instância — `vi.spyOn(http,
 * "request")` não intercepta essas chamadas).
 */
type InterceptorManager<Fn> = { handlers: { fulfilled?: Fn; rejected?: Fn }[] };

function getRequestHandler(http: typeof import("./http").http) {
  const manager = http.interceptors.request as unknown as InterceptorManager<
    (c: InternalAxiosRequestConfig) => InternalAxiosRequestConfig
  >;
  return manager.handlers[0].fulfilled!;
}

function getResponseRejectedHandler(http: typeof import("./http").http) {
  const manager = http.interceptors.response as unknown as InterceptorManager<
    (e: unknown) => Promise<unknown>
  >;
  return manager.handlers[0].rejected!;
}

function buildRequestConfig(
  method: string,
  overrides: Partial<InternalAxiosRequestConfig> = {},
): InternalAxiosRequestConfig {
  return {
    headers: new AxiosHeaders(),
    method,
    ...overrides,
  } as InternalAxiosRequestConfig;
}

function buildUnauthorizedError(
  url: string | undefined,
  overrides: Partial<InternalAxiosRequestConfig> = {},
) {
  const originalRequest = {
    url,
    method: "get",
    headers: new AxiosHeaders(),
    ...overrides,
  };

  return new AxiosError(
    "Unauthorized",
    "ERR_BAD_REQUEST",
    originalRequest as never,
    undefined,
    {
      status: 401,
      data: {},
      statusText: "Unauthorized",
      headers: {},
      config: originalRequest as never,
    },
  );
}

function mockOkAdapter(http: typeof import("./http").http) {
  const adapterSpy = vi.fn().mockResolvedValue({
    data: "ok",
    status: 200,
    statusText: "OK",
    headers: {},
    config: {},
  });
  http.defaults.adapter = adapterSpy;
  return adapterSpy;
}

describe("lib/api/http", () => {
  beforeEach(() => {
    vi.resetModules();
    refreshMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("cria uma instância única do Axios com baseURL a partir de clientEnv e withCredentials: true", async () => {
    const { http } = await import("./http");

    expect(http.defaults.baseURL).toBe("http://localhost:3333");
    expect(http.defaults.withCredentials).toBe(true);
  });

  describe("getAccessToken/setAccessToken", () => {
    it("começa como null e reflete o valor gravado", async () => {
      const { getAccessToken, setAccessToken } = await import("./http");

      expect(getAccessToken()).toBeNull();

      setAccessToken("token-123");
      expect(getAccessToken()).toBe("token-123");

      setAccessToken(null);
      expect(getAccessToken()).toBeNull();
    });
  });

  describe("interceptor de request — Authorization", () => {
    it("anexa Authorization: Bearer <token> quando há token em memória", async () => {
      const { http, setAccessToken } = await import("./http");
      setAccessToken("abc123");

      const config = getRequestHandler(http)(buildRequestConfig("get"));

      expect(config.headers.get("Authorization")).toBe("Bearer abc123");
    });

    it("omite Authorization quando não há token em memória", async () => {
      const { http } = await import("./http");

      const config = getRequestHandler(http)(buildRequestConfig("get"));

      expect(config.headers.get("Authorization")).toBeUndefined();
    });
  });

  describe("interceptor de request — X-CSRF-Token", () => {
    afterEach(() => {
      document.cookie = "csrf_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC";
    });

    it("anexa X-CSRF-Token em métodos mutantes quando o cookie csrf_token existe", async () => {
      document.cookie = "csrf_token=csrf-abc";
      const { http } = await import("./http");

      const config = getRequestHandler(http)(buildRequestConfig("post"));

      expect(config.headers.get("X-CSRF-Token")).toBe("csrf-abc");
    });

    it("omite X-CSRF-Token em métodos não mutantes (GET)", async () => {
      document.cookie = "csrf_token=csrf-abc";
      const { http } = await import("./http");

      const config = getRequestHandler(http)(buildRequestConfig("get"));

      expect(config.headers.get("X-CSRF-Token")).toBeUndefined();
    });

    it("omite X-CSRF-Token quando document está indisponível (contexto SSR)", async () => {
      const originalDocument = globalThis.document;
      // @ts-expect-error -- simula ausência de `document` em SSR.
      delete globalThis.document;

      try {
        const { http } = await import("./http");

        const config = getRequestHandler(http)(buildRequestConfig("post"));

        expect(config.headers.get("X-CSRF-Token")).toBeUndefined();
      } finally {
        globalThis.document = originalDocument;
      }
    });

    it("omite X-CSRF-Token em métodos mutantes quando não há cookie csrf_token", async () => {
      const { http } = await import("./http");

      const config = getRequestHandler(http)(buildRequestConfig("post"));

      expect(config.headers.get("X-CSRF-Token")).toBeUndefined();
    });
  });

  describe("interceptor de response — refresh-then-retry em 401", () => {
    it("em 401 de uma chamada autenticada, chama refresh() uma única vez e repete a request original", async () => {
      const { http, getAccessToken } = await import("./http");

      refreshMock.mockResolvedValue({
        accessToken: "novo-token",
        user: { id: "1", email: "a@a.com", name: "A" },
      });
      const adapterSpy = mockOkAdapter(http);

      const error = buildUnauthorizedError("/works");
      const result = await getResponseRejectedHandler(http)(error);

      expect(refreshMock).toHaveBeenCalledTimes(1);
      expect(getAccessToken()).toBe("novo-token");
      expect(adapterSpy).toHaveBeenCalledWith(
        expect.objectContaining({ url: "/works", _retry: true }),
      );
      expect(result).toMatchObject({ data: "ok" });
    });

    it("uma segunda falha 401 na mesma request (_retry já true) não tenta novo refresh — propaga o erro", async () => {
      const { http } = await import("./http");

      const error = buildUnauthorizedError("/works", { _retry: true } as never);

      await expect(getResponseRejectedHandler(http)(error)).rejects.toBe(error);
      expect(refreshMock).not.toHaveBeenCalled();
    });

    it("não tenta refresh quando a request que falhou com 401 é /auth/login", async () => {
      const { http } = await import("./http");

      const error = buildUnauthorizedError("/auth/login", { method: "post" });

      await expect(getResponseRejectedHandler(http)(error)).rejects.toBe(error);
      expect(refreshMock).not.toHaveBeenCalled();
    });

    it("não tenta novo refresh quando a request que falhou com 401 é /auth/refresh (evita loop)", async () => {
      const { http } = await import("./http");

      const error = buildUnauthorizedError("/auth/refresh", { method: "post" });

      await expect(getResponseRejectedHandler(http)(error)).rejects.toBe(error);
      expect(refreshMock).not.toHaveBeenCalled();
    });

    it("tenta refresh normalmente em 401 quando a request original não tem url definido", async () => {
      const { http, getAccessToken } = await import("./http");

      refreshMock.mockResolvedValue({
        accessToken: "novo-token",
        user: { id: "1", email: "a@a.com", name: "A" },
      });
      mockOkAdapter(http);

      const error = buildUnauthorizedError(undefined);

      await getResponseRejectedHandler(http)(error);

      expect(refreshMock).toHaveBeenCalledTimes(1);
      expect(getAccessToken()).toBe("novo-token");
    });

    it("propaga erros com status diferente de 401 sem tentar refresh", async () => {
      const { http } = await import("./http");

      const originalRequest = {
        url: "/works",
        method: "get",
        headers: new AxiosHeaders(),
      };

      const error = new AxiosError(
        "Server error",
        "ERR_BAD_RESPONSE",
        originalRequest as never,
        undefined,
        {
          status: 500,
          data: {},
          statusText: "Internal Server Error",
          headers: {},
          config: originalRequest as never,
        },
      );

      await expect(getResponseRejectedHandler(http)(error)).rejects.toBe(error);
      expect(refreshMock).not.toHaveBeenCalled();
    });

    it("quando o refresh falha, limpa o accessToken e dispara onAuthFailure()", async () => {
      const { http, getAccessToken, onAuthFailure, setAccessToken } =
        await import("./http");

      setAccessToken("token-antigo");
      refreshMock.mockRejectedValue(new Error("refresh failed"));

      const failureCallback = vi.fn();
      onAuthFailure(failureCallback);

      const error = buildUnauthorizedError("/works");

      await expect(getResponseRejectedHandler(http)(error)).rejects.toThrow(
        "refresh failed",
      );
      expect(getAccessToken()).toBeNull();
      expect(failureCallback).toHaveBeenCalledTimes(1);
    });

    it("chamadas 401 concorrentes compartilham a mesma promise de refresh (single-flight)", async () => {
      const { http } = await import("./http");

      let resolveRefresh!: (value: {
        accessToken: string;
        user: { id: string; email: string; name: string };
      }) => void;
      refreshMock.mockReturnValue(
        new Promise((resolve) => {
          resolveRefresh = resolve;
        }),
      );
      mockOkAdapter(http);

      const responseHandler = getResponseRejectedHandler(http);
      const call1 = responseHandler(buildUnauthorizedError("/works"));
      const call2 = responseHandler(buildUnauthorizedError("/comments"));

      resolveRefresh({
        accessToken: "novo-token",
        user: { id: "1", email: "a@a.com", name: "A" },
      });

      await Promise.all([call1, call2]);

      expect(refreshMock).toHaveBeenCalledTimes(1);
    });
  });
});
