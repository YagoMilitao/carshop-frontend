import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * `lib/api/http.ts` lê `clientEnv` no top-level (fail-fast), que por sua
 * vez exige `NEXT_PUBLIC_API_URL` e `NEXT_PUBLIC_SITE_URL`. Usamos import
 * dinâmico + `vi.resetModules()` para controlar as duas variáveis
 * isoladamente, no mesmo padrão de `lib/env/client.test.ts`.
 */
describe("lib/api/http", () => {
  const originalApiUrl = process.env.NEXT_PUBLIC_API_URL;
  const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  afterEach(() => {
    if (originalApiUrl === undefined) {
      delete process.env.NEXT_PUBLIC_API_URL;
    } else {
      process.env.NEXT_PUBLIC_API_URL = originalApiUrl;
    }

    if (originalSiteUrl === undefined) {
      delete process.env.NEXT_PUBLIC_SITE_URL;
    } else {
      process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
    }

    vi.resetModules();
  });

  it("cria uma instância única do Axios com baseURL a partir de clientEnv", async () => {
    process.env.NEXT_PUBLIC_API_URL = "http://localhost:3333";
    process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";
    vi.resetModules();

    const { http } = await import("./http");

    expect(http.defaults.baseURL).toBe("http://localhost:3333");
  });
});
