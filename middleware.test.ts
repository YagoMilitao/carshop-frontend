import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";

import { middleware } from "./middleware";

function buildRequest(pathname: string, cookieHeader?: string): NextRequest {
  return new NextRequest(`http://localhost:3000${pathname}`, {
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
  });
}

describe("middleware (camada 1 de proteção /admin/*)", () => {
  it("redireciona para /admin/login quando o cookie refresh_token está ausente", () => {
    const request = buildRequest("/admin");

    const response = middleware(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/admin/login",
    );
  });

  it("segue adiante (NextResponse.next()) quando o cookie refresh_token está presente", () => {
    const request = buildRequest("/admin", "refresh_token=rt-1");

    const response = middleware(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("não intercepta /admin/login mesmo sem o cookie refresh_token (evita loop de redirect)", () => {
    const request = buildRequest("/admin/login");

    const response = middleware(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });
});
