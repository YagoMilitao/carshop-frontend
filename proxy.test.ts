import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";

import { proxy } from "./proxy";
import { REDIRECT_PATHNAME_HEADER, REDIRECT_SEARCH_HEADER } from "@/lib/auth/redirect";

function buildRequest(
  pathname: string,
  options?: { cookieHeader?: string; extraHeaders?: Record<string, string> },
): NextRequest {
  const headers: Record<string, string> = { ...options?.extraHeaders };

  if (options?.cookieHeader) {
    headers.cookie = options.cookieHeader;
  }

  return new NextRequest(`http://localhost:3000${pathname}`, {
    headers,
  });
}

describe("proxy (camada 1 de proteção /admin/*)", () => {
  it("redireciona para /admin/login sem ?redirect= quando a rota original já é /admin", () => {
    const request = buildRequest("/admin");

    const response = proxy(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/admin/login",
    );
  });

  it("redireciona para /admin/login com ?redirect= incluindo a rota original quando não é /admin", () => {
    const request = buildRequest("/admin/trabalhos/123");

    const response = proxy(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/admin/login?redirect=%2Fadmin%2Ftrabalhos%2F123",
    );
  });

  it("redireciona para /admin/login com ?redirect= incluindo pathname + search original", () => {
    const request = buildRequest("/admin/trabalhos/123?tab=fotos");

    const response = proxy(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/admin/login?redirect=%2Fadmin%2Ftrabalhos%2F123%3Ftab%3Dfotos",
    );
  });

  it("segue adiante (NextResponse.next()) quando o cookie refresh_token está presente, propagando os headers de pathname/search", () => {
    const request = buildRequest("/admin/trabalhos/123", {
      cookieHeader: "refresh_token=rt-1",
    });

    const response = proxy(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get(`x-middleware-request-${REDIRECT_PATHNAME_HEADER}`)).toBe(
      "/admin/trabalhos/123",
    );
  });

  it("não intercepta /admin/login mesmo sem o cookie refresh_token (evita loop de redirect), propagando os headers de pathname/search", () => {
    const request = buildRequest("/admin/login?redirect=%2Fadmin%2Ftrabalhos%2F1");

    const response = proxy(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get(`x-middleware-request-${REDIRECT_PATHNAME_HEADER}`)).toBe(
      "/admin/login",
    );
    expect(response.headers.get(`x-middleware-request-${REDIRECT_SEARCH_HEADER}`)).toBe(
      "?redirect=%2Fadmin%2Ftrabalhos%2F1",
    );
  });

  it("nunca confia em x-carshop-pathname/x-carshop-search enviados pelo client como header de entrada", () => {
    const request = buildRequest("/admin/trabalhos/123", {
      cookieHeader: "refresh_token=rt-1",
      extraHeaders: {
        [REDIRECT_PATHNAME_HEADER]: "/forjado",
        [REDIRECT_SEARCH_HEADER]: "?forjado=1",
      },
    });

    const response = proxy(request);

    expect(response.headers.get(`x-middleware-request-${REDIRECT_PATHNAME_HEADER}`)).toBe(
      "/admin/trabalhos/123",
    );
    expect(response.headers.get(`x-middleware-request-${REDIRECT_SEARCH_HEADER}`)).toBe(
      "",
    );
  });
});
