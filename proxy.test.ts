import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

/**
 * `proxy.ts` importa `serverEnv` (server-only), que por sua vez lê
 * `clientEnv` — mockamos `@/lib/env/server` diretamente para controlar
 * `apiUrl` sem depender de variáveis de ambiente reais no processo de
 * teste. `fetch` é mockado — nenhuma chamada de rede real a `/auth/refresh`.
 */
vi.mock("@/lib/env/server", () => ({
  serverEnv: { apiUrl: "https://api.carshop.test" },
}));

function buildRequest(pathname: string, cookieHeader?: string): NextRequest {
  return new NextRequest(`http://localhost:3000${pathname}`, {
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
  });
}

describe("proxy (camada 1 de proteção /admin/* + mint do access token)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it("não intercepta /admin/login mesmo sem o cookie refresh_token (evita loop de redirect)", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { proxy } = await import("./proxy");
    const request = buildRequest("/admin/login");

    const response = await proxy(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("redireciona para /admin/login sem chamar /auth/refresh quando o cookie refresh_token está ausente", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { proxy } = await import("./proxy");
    const request = buildRequest("/admin");

    const response = await proxy(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/admin/login",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("mint bem-sucedido: repassa Set-Cookie rotacionado e injeta o header interno do access token", async () => {
    const responseHeaders = new Headers();
    responseHeaders.append(
      "set-cookie",
      "refresh_token=rt-2; HttpOnly; Path=/",
    );
    responseHeaders.append("set-cookie", "csrf_token=csrf-2; Path=/");

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: responseHeaders,
      json: async () => ({ accessToken: "access-token-1" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { proxy } = await import("./proxy");
    const request = buildRequest(
      "/admin",
      "refresh_token=rt-1; csrf_token=csrf-1",
    );

    const response = await proxy(request);

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.carshop.test/auth/refresh",
      expect.objectContaining({
        method: "POST",
        headers: {
          Cookie: "refresh_token=rt-1; csrf_token=csrf-1",
          "X-CSRF-Token": "csrf-1",
        },
        cache: "no-store",
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();

    const setCookies = response.headers.getSetCookie();
    expect(setCookies).toContain("refresh_token=rt-2; HttpOnly; Path=/");
    expect(setCookies).toContain("csrf_token=csrf-2; Path=/");

    // O header interno do access token nunca deve ser exposto na resposta
    // real enviada ao navegador.
    expect(response.headers.get("x-carshop-access-token")).toBeNull();
  });

  it("mint sem csrf_token no cookie: não envia X-CSRF-Token", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers(),
      json: async () => ({ accessToken: "access-token-1" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { proxy } = await import("./proxy");
    const request = buildRequest("/admin", "refresh_token=rt-1");

    await proxy(request);

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.carshop.test/auth/refresh",
      expect.objectContaining({
        headers: { Cookie: "refresh_token=rt-1" },
      }),
    );
  });

  it("resposta não-ok de /auth/refresh (ex.: 401): redireciona e limpa refresh_token/csrf_token", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      headers: new Headers(),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { proxy } = await import("./proxy");
    const request = buildRequest(
      "/admin",
      "refresh_token=expired-rt; csrf_token=csrf-1",
    );

    const response = await proxy(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/admin/login",
    );

    const setCookies = response.headers.getSetCookie();
    expect(setCookies.some((c) => c.startsWith("refresh_token=;"))).toBe(
      true,
    );
    expect(setCookies.some((c) => c.startsWith("csrf_token=;"))).toBe(true);
  });

  it("falha de rede ao chamar /auth/refresh: redireciona para /admin/login", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("network error"));
    vi.stubGlobal("fetch", fetchMock);

    const { proxy } = await import("./proxy");
    const request = buildRequest("/admin", "refresh_token=rt-1");

    const response = await proxy(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/admin/login",
    );
  });

  it("fallback quando headers.getSetCookie não está disponível: repassa via .get('set-cookie')", async () => {
    const rawHeaders = {
      get: (name: string) =>
        name.toLowerCase() === "set-cookie"
          ? "refresh_token=rt-2; HttpOnly; Path=/"
          : null,
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: rawHeaders,
      json: async () => ({ accessToken: "access-token-1" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { proxy } = await import("./proxy");
    const request = buildRequest("/admin", "refresh_token=rt-1");

    const response = await proxy(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toBe(
      "refresh_token=rt-2; HttpOnly; Path=/",
    );
  });
});
