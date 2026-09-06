import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * `lib/api/http.ts` lê `clientEnv` no top-level (fail-fast). Usamos
 * import dinâmico + `vi.resetModules()` para controlar
 * `NEXT_PUBLIC_API_URL` isoladamente, no mesmo padrão de
 * `lib/env/client.test.ts`.
 */
describe("lib/api/http", () => {
  const originalValue = process.env.NEXT_PUBLIC_API_URL;

  afterEach(() => {
    if (originalValue === undefined) {
      delete process.env.NEXT_PUBLIC_API_URL;
    } else {
      process.env.NEXT_PUBLIC_API_URL = originalValue;
    }
    vi.resetModules();
  });

  it("cria uma instância única do Axios com baseURL a partir de clientEnv", async () => {
    process.env.NEXT_PUBLIC_API_URL = "http://localhost:3333";
    vi.resetModules();

    const { http } = await import("./http");

    expect(http.defaults.baseURL).toBe("http://localhost:3333");
  });
});
