import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * `lib/api/auth.server.ts` declara `import "server-only"` — mockado como
 * no-op, mesmo padrão de `lib/api/works.test.ts`. `next/headers` (`cookies`)
 * é mockado para controlar o `Cookie` header repassado manualmente ao
 * backend. `fetch` é mockado — nenhuma chamada de rede real.
 */
vi.mock("server-only", () => ({}));

const cookiesMock = vi.fn();

vi.mock("next/headers", () => ({
  cookies: () => cookiesMock(),
}));

describe("lib/api/auth.server", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it("repassa o header Cookie da request atual para GET /auth/session", async () => {
    cookiesMock.mockResolvedValue({
      toString: () => "refresh_token=rt-1; csrf_token=csrf-1",
    });

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
        headers: { Cookie: "refresh_token=rt-1; csrf_token=csrf-1" },
        cache: "no-store",
      }),
    );
  });

  it("não envia header Cookie quando não há cookies na request", async () => {
    cookiesMock.mockResolvedValue({ toString: () => "" });

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ user: { id: "1", email: "a@a.com", name: "A" } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { getSession } = await import("./auth.server");

    await getSession();

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/auth/session"),
      expect.objectContaining({ headers: undefined }),
    );
  });

  it("retorna null quando a resposta não é ok (sessão ausente/expirada)", async () => {
    cookiesMock.mockResolvedValue({ toString: () => "" });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 401 }),
    );

    const { getSession } = await import("./auth.server");

    const result = await getSession();

    expect(result).toBeNull();
  });

  it("retorna null quando o fetch lança (erro de rede)", async () => {
    cookiesMock.mockResolvedValue({ toString: () => "" });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network error")),
    );

    const { getSession } = await import("./auth.server");

    const result = await getSession();

    expect(result).toBeNull();
  });
});
