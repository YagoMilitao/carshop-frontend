import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";

import { proxy } from "./proxy";

function buildRequest(pathname: string, cookieHeader?: string): NextRequest {
  return new NextRequest(`http://localhost:3000${pathname}`, {
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
  });
}

describe("proxy (camada 1 de proteção /admin/*)", () => {
  it("redireciona para /admin/login quando o cookie refresh_token está ausente", () => {
    const request = buildRequest("/admin");

    const response = proxy(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/admin/login",
    );
  });

  it("segue adiante (NextResponse.next()) quando o cookie refresh_token está presente", () => {
    const request = buildRequest("/admin", "refresh_token=rt-1");

    const response = proxy(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("não intercepta /admin/login mesmo sem o cookie refresh_token (evita loop de redirect)", () => {
    const request = buildRequest("/admin/login");

    const response = proxy(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });
});
