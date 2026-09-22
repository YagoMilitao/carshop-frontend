import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * `lib/api/auth.server.ts` declara `import "server-only"` — mockado como
 * no-op, mesmo padrão de `lib/api/works.test.ts`. `next/headers` (`headers`)
 * é mockado para controlar o header interno `x-carshop-access-token`
 * (injetado por `proxy.ts` antes do render — ver CARSHOP-152).
 * `fetch` é mockado — nenhuma chamada de rede real.
 */
vi.mock("server-only", () => ({}));

const headersMock = vi.fn();

vi.mock("next/headers", () => ({
  headers: () => headersMock(),
}));

describe("lib/api/auth.server", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it("retorna null quando o header interno x-carshop-access-token está ausente (proxy não mintou access token)", async () => {
    headersMock.mockResolvedValue(new Headers());

    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { getSession } = await import("./auth.server");

    const result = await getSession();

    expect(result).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("envia Authorization: Bearer <accessToken> para GET /auth/session quando o header interno está presente", async () => {
    headersMock.mockResolvedValue(
      new Headers({ "x-carshop-access-token": "access-token-1" }),
    );

    const session = {
      user: { id: "1", email: "admin@carshop.com", name: "Admin" },
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => session,
    });
    vi.stubGlobal("fetch", fetchMock);

    const { getSession } = await import("./auth.server");

    const result = await getSession();

    expect(result).toEqual(session);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/auth/session"),
      expect.objectContaining({
        headers: { Authorization: "Bearer access-token-1" },
        cache: "no-store",
      }),
    );
  });

  it("retorna null quando o backend responde não-ok (access token inválido/expirado)", async () => {
    headersMock.mockResolvedValue(
      new Headers({ "x-carshop-access-token": "expired-access-token" }),
    );

    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 401 });
    vi.stubGlobal("fetch", fetchMock);

    const { getSession } = await import("./auth.server");

    const result = await getSession();

    expect(result).toBeNull();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/auth/session"),
      expect.objectContaining({
        headers: { Authorization: "Bearer expired-access-token" },
        cache: "no-store",
      }),
    );
  });

  it("retorna null quando o fetch lança (erro de rede)", async () => {
    headersMock.mockResolvedValue(
      new Headers({ "x-carshop-access-token": "access-token-1" }),
    );

    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network error")),
    );

    const { getSession } = await import("./auth.server");

    const result = await getSession();

    expect(result).toBeNull();
  });
});
