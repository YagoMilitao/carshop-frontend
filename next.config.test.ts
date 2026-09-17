import { describe, expect, it } from "vitest";

import nextConfig from "./next.config.mjs";

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
