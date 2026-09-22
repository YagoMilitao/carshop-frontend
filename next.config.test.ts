import { afterEach, describe, expect, it, vi } from "vitest";

import nextConfig from "./next.config.mjs";

/**
 * `rewrites()` não lê nenhum estado module-level cacheado — cada chamada
 * relê `process.env.NEXT_PUBLIC_API_URL`/`NODE_ENV` diretamente. Por isso,
 * ao contrário de `lib/api/http.ts`/`lib/env/client.ts`, não é necessário
 * `vi.resetModules()` + reimport para testar cenários diferentes de env:
 * basta manipular `process.env` antes de cada chamada a `rewrites()`.
 */
describe("next.config.mjs — rewrites (CARSHOP-150, proxy same-origin obrigatório)", () => {
  const originalApiUrl = process.env.NEXT_PUBLIC_API_URL;
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    if (originalApiUrl === undefined) {
      delete process.env.NEXT_PUBLIC_API_URL;
    } else {
      process.env.NEXT_PUBLIC_API_URL = originalApiUrl;
    }

    vi.stubEnv("NODE_ENV", originalNodeEnv ?? "test");
  });

  it("gera o rewrite /api-proxy/:path* -> backend em produção (NODE_ENV=production), não apenas em dev", async () => {
    vi.stubEnv("NODE_ENV", "production");
    process.env.NEXT_PUBLIC_API_URL = "https://api.carshop.example.com";

    const rewrites = await nextConfig.rewrites!();

    expect(rewrites).toEqual([
      {
        source: "/api-proxy/:path*",
        destination: "https://api.carshop.example.com/:path*",
      },
    ]);
  });

  it("gera o mesmo rewrite em desenvolvimento (NODE_ENV=development), confirmando que não é mais dev-only", async () => {
    vi.stubEnv("NODE_ENV", "development");
    process.env.NEXT_PUBLIC_API_URL = "http://localhost:3333";

    const rewrites = await nextConfig.rewrites!();

    expect(rewrites).toEqual([
      {
        source: "/api-proxy/:path*",
        destination: "http://localhost:3333/:path*",
      },
    ]);
  });

  it("remove barras finais da URL do backend antes de montar o destino", async () => {
    process.env.NEXT_PUBLIC_API_URL = "https://api.carshop.example.com///";

    const rewrites = await nextConfig.rewrites!();

    expect(rewrites).toEqual([
      {
        source: "/api-proxy/:path*",
        destination: "https://api.carshop.example.com/:path*",
      },
    ]);
  });

  it("retorna lista vazia quando NEXT_PUBLIC_API_URL não está definida, independente do ambiente", async () => {
    vi.stubEnv("NODE_ENV", "production");
    delete process.env.NEXT_PUBLIC_API_URL;

    const rewrites = await nextConfig.rewrites!();

    expect(rewrites).toEqual([]);
  });
});

describe("next.config.mjs — redirects (CARSHOP-23)", () => {
  it("redireciona /trabalhos para /portfolio de forma permanente (SEO-friendly, 308)", async () => {
    expect(nextConfig.redirects).toBeDefined();

    const redirects = await nextConfig.redirects!();

    expect(redirects).toContainEqual({
      source: "/trabalhos",
      destination: "/portfolio",
      permanent: true,
    });
  });

  it("não define nenhum outro redirect não previsto para a rota /trabalhos", async () => {
    const redirects = await nextConfig.redirects!();

    const trabalhosRedirects = redirects.filter(
      (redirect) => redirect.source === "/trabalhos",
    );

    expect(trabalhosRedirects).toHaveLength(1);
  });
});
