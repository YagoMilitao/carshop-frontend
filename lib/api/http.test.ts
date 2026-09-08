import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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
      const { AxiosHeaders } = await import("axios");
      setAccessToken("abc123");

      const handler = (
        http.interceptors.request as unknown as {
          handlers: {
            fulfilled: (
              c: import("axios").InternalAxiosRequestConfig,
            ) => import("axios").InternalAxiosRequestConfig;
          }[];
        }
      ).handlers[0].fulfilled;

      const config = handler({
        headers: new AxiosHeaders(),
        method: "get",
      } as import("axios").InternalAxiosRequestConfig);

      expect(config.headers.get("Authorization")).toBe("Bearer abc123");
    });

    it("omite Authorization quando não há token em memória", async () => {
      const { http } = await import("./http");
      const { AxiosHeaders } = await import("axios");

      const handler = (
        http.interceptors.request as unknown as {
          handlers: {
            fulfilled: (
              c: import("axios").InternalAxiosRequestConfig,
            ) => import("axios").InternalAxiosRequestConfig;
          }[];
        }
      ).handlers[0].fulfilled;

      const config = handler({
        headers: new AxiosHeaders(),
        method: "get",
      } as import("axios").InternalAxiosRequestConfig);

      expect(config.headers.get("Authorization")).toBeUndefined();
    });
  });

  describe("interceptor de request — X-CSRF-Token", () => {
    it("anexa X-CSRF-Token em métodos mutantes quando o cookie csrf_token existe", async () => {
      document.cookie = "csrf_token=csrf-abc";
      const { http } = await import("./http");
      const { AxiosHeaders } = await import("axios");

      const handler = (
        http.interceptors.request as unknown as {
          handlers: {
            fulfilled: (
              c: import("axios").InternalAxiosRequestConfig,
            ) => import("axios").InternalAxiosRequestConfig;
          }[];
        }
      ).handlers[0].fulfilled;

      const config = handler({
        headers: new AxiosHeaders(),
        method: "post",
      } as import("axios").InternalAxiosRequestConfig);

      expect(config.headers.get("X-CSRF-Token")).toBe("csrf-abc");

      document.cookie = "csrf_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC";
    });

    it("omite X-CSRF-Token em métodos não mutantes (GET)", async () => {
      document.cookie = "csrf_token=csrf-abc";
      const { http } = await import("./http");
      const { AxiosHeaders } = await import("axios");

      const handler = (
        http.interceptors.request as unknown as {
          handlers: {
            fulfilled: (
              c: import("axios").InternalAxiosRequestConfig,
            ) => import("axios").InternalAxiosRequestConfig;
          }[];
        }
      ).handlers[0].fulfilled;

      const config = handler({
        headers: new AxiosHeaders(),
        method: "get",
      } as import("axios").InternalAxiosRequestConfig);

      expect(config.headers.get("X-CSRF-Token")).toBeUndefined();

      document.cookie = "csrf_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC";
    });

    it("omite X-CSRF-Token quando document está indisponível (contexto SSR)", async () => {
      const originalDocument = globalThis.document;
      // @ts-expect-error -- simula ausência de `document` em SSR.
      delete globalThis.document;

      try {
        const { http } = await import("./http");
        const { AxiosHeaders } = await import("axios");

        const handler = (
          http.interceptors.request as unknown as {
            handlers: {
              fulfilled: (
                c: import("axios").InternalAxiosRequestConfig,
              ) => import("axios").InternalAxiosRequestConfig;
            }[];
          }
        ).handlers[0].fulfilled;

        const config = handler({
          headers: new AxiosHeaders(),
          method: "post",
        } as import("axios").InternalAxiosRequestConfig);

        expect(config.headers.get("X-CSRF-Token")).toBeUndefined();
      } finally {
        globalThis.document = originalDocument;
      }
    });

    it("omite X-CSRF-Token em métodos mutantes quando não há cookie csrf_token", async () => {
      const { http } = await import("./http");
      const { AxiosHeaders } = await import("axios");

      const handler = (
        http.interceptors.request as unknown as {
          handlers: {
            fulfilled: (
              c: import("axios").InternalAxiosRequestConfig,
            ) => import("axios").InternalAxiosRequestConfig;
          }[];
        }
      ).handlers[0].fulfilled;

      const config = handler({
        headers: new AxiosHeaders(),
        method: "post",
      } as import("axios").InternalAxiosRequestConfig);

      expect(config.headers.get("X-CSRF-Token")).toBeUndefined();
    });
  });

  describe("interceptor de response — refresh-then-retry em 401", () => {
    it("em 401 de uma chamada autenticada, chama refresh() uma única vez e repete a request original", async () => {
      const { http, getAccessToken } = await import("./http");
      const { AxiosError, AxiosHeaders } = await import("axios");

      refreshMock.mockResolvedValue({
        accessToken: "novo-token",
        user: { id: "1", email: "a@a.com", name: "A" },
      });

      // `http(originalRequest)` invoca a instância Axios diretamente (não
      // `http.request(...)`), então a única forma confiável de observar/
      // controlar a re-tentativa sem golpear a rede é substituir o
      // adapter — lido dinamicamente por chamada, ao contrário do método
      // bound `http()`, que captura a função original no momento da
      // criação da instância (`vi.spyOn(http, "request")` não intercepta
      // chamadas via `http(config)`).
      const adapterSpy = vi
        .fn()
        .mockResolvedValue({
          data: "ok",
          status: 200,
          statusText: "OK",
          headers: {},
          config: {},
        });
      http.defaults.adapter = adapterSpy;

      const originalRequest = {
        url: "/works",
        method: "get",
        headers: new AxiosHeaders(),
      };

      const error = new AxiosError(
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

      const responseHandler = (
        http.interceptors.response as unknown as {
          handlers: {
            rejected: (e: unknown) => Promise<unknown>;
          }[];
        }
      ).handlers[0].rejected;

      const result = await responseHandler(error);

      expect(refreshMock).toHaveBeenCalledTimes(1);
      expect(getAccessToken()).toBe("novo-token");
      expect(adapterSpy).toHaveBeenCalledWith(
        expect.objectContaining({ url: "/works", _retry: true }),
      );
      expect(result).toMatchObject({ data: "ok" });
    });

    it("uma segunda falha 401 na mesma request (_retry já true) não tenta novo refresh — propaga o erro", async () => {
      const { http } = await import("./http");
      const { AxiosError, AxiosHeaders } = await import("axios");

      const originalRequest = {
        url: "/works",
        method: "get",
        headers: new AxiosHeaders(),
        _retry: true,
      };

      const error = new AxiosError(
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

      const responseHandler = (
        http.interceptors.response as unknown as {
          handlers: {
            rejected: (e: unknown) => Promise<unknown>;
          }[];
        }
      ).handlers[0].rejected;

      await expect(responseHandler(error)).rejects.toBe(error);
      expect(refreshMock).not.toHaveBeenCalled();
    });

    it("não tenta refresh quando a request que falhou com 401 é /auth/login", async () => {
      const { http } = await import("./http");
      const { AxiosError, AxiosHeaders } = await import("axios");

      const originalRequest = {
        url: "/auth/login",
        method: "post",
        headers: new AxiosHeaders(),
      };

      const error = new AxiosError(
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

      const responseHandler = (
        http.interceptors.response as unknown as {
          handlers: {
            rejected: (e: unknown) => Promise<unknown>;
          }[];
        }
      ).handlers[0].rejected;

      await expect(responseHandler(error)).rejects.toBe(error);
      expect(refreshMock).not.toHaveBeenCalled();
    });

    it("não tenta novo refresh quando a request que falhou com 401 é /auth/refresh (evita loop)", async () => {
      const { http } = await import("./http");
      const { AxiosError, AxiosHeaders } = await import("axios");

      const originalRequest = {
        url: "/auth/refresh",
        method: "post",
        headers: new AxiosHeaders(),
      };

      const error = new AxiosError(
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

      const responseHandler = (
        http.interceptors.response as unknown as {
          handlers: {
            rejected: (e: unknown) => Promise<unknown>;
          }[];
        }
      ).handlers[0].rejected;

      await expect(responseHandler(error)).rejects.toBe(error);
      expect(refreshMock).not.toHaveBeenCalled();
    });

    it("tenta refresh normalmente em 401 quando a request original não tem url definido", async () => {
      const { http, getAccessToken } = await import("./http");
      const { AxiosError, AxiosHeaders } = await import("axios");

      refreshMock.mockResolvedValue({
        accessToken: "novo-token",
        user: { id: "1", email: "a@a.com", name: "A" },
      });
      http.defaults.adapter = vi.fn().mockResolvedValue({
        data: "ok",
        status: 200,
        statusText: "OK",
        headers: {},
        config: {},
      });

      const originalRequest = {
        url: undefined,
        method: "get",
        headers: new AxiosHeaders(),
      };

      const error = new AxiosError(
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

      const responseHandler = (
        http.interceptors.response as unknown as {
          handlers: {
            rejected: (e: unknown) => Promise<unknown>;
          }[];
        }
      ).handlers[0].rejected;

      await responseHandler(error);

      expect(refreshMock).toHaveBeenCalledTimes(1);
      expect(getAccessToken()).toBe("novo-token");
    });

    it("propaga erros com status diferente de 401 sem tentar refresh", async () => {
      const { http } = await import("./http");
      const { AxiosError, AxiosHeaders } = await import("axios");

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

      const responseHandler = (
        http.interceptors.response as unknown as {
          handlers: {
            rejected: (e: unknown) => Promise<unknown>;
          }[];
        }
      ).handlers[0].rejected;

      await expect(responseHandler(error)).rejects.toBe(error);
      expect(refreshMock).not.toHaveBeenCalled();
    });

    it("quando o refresh falha, limpa o accessToken e dispara onAuthFailure()", async () => {
      const { http, getAccessToken, onAuthFailure, setAccessToken } =
        await import("./http");
      const { AxiosError, AxiosHeaders } = await import("axios");

      setAccessToken("token-antigo");
      refreshMock.mockRejectedValue(new Error("refresh failed"));

      const failureCallback = vi.fn();
      onAuthFailure(failureCallback);

      const originalRequest = {
        url: "/works",
        method: "get",
        headers: new AxiosHeaders(),
      };

      const error = new AxiosError(
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

      const responseHandler = (
        http.interceptors.response as unknown as {
          handlers: {
            rejected: (e: unknown) => Promise<unknown>;
          }[];
        }
      ).handlers[0].rejected;

      await expect(responseHandler(error)).rejects.toThrow("refresh failed");
      expect(getAccessToken()).toBeNull();
      expect(failureCallback).toHaveBeenCalledTimes(1);
    });

    it("chamadas 401 concorrentes compartilham a mesma promise de refresh (single-flight)", async () => {
      const { http } = await import("./http");
      const { AxiosError, AxiosHeaders } = await import("axios");

      let resolveRefresh!: (value: {
        accessToken: string;
        user: { id: string; email: string; name: string };
      }) => void;
      refreshMock.mockReturnValue(
        new Promise((resolve) => {
          resolveRefresh = resolve;
        }),
      );

      http.defaults.adapter = vi.fn().mockResolvedValue({
        data: "ok",
        status: 200,
        statusText: "OK",
        headers: {},
        config: {},
      });

      const buildError = (url: string) => {
        const originalRequest = {
          url,
          method: "get",
          headers: new AxiosHeaders(),
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
      };

      const responseHandler = (
        http.interceptors.response as unknown as {
          handlers: {
            rejected: (e: unknown) => Promise<unknown>;
          }[];
        }
      ).handlers[0].rejected;

      const call1 = responseHandler(buildError("/works"));
      const call2 = responseHandler(buildError("/comments"));

      resolveRefresh({
        accessToken: "novo-token",
        user: { id: "1", email: "a@a.com", name: "A" },
      });

      await Promise.all([call1, call2]);

      expect(refreshMock).toHaveBeenCalledTimes(1);
    });
  });
});
