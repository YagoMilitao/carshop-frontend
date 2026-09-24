import { describe, expect, it } from "vitest";

import { adminNavLinks, isAdminNavItemActive } from "./admin-nav-links";

const dashboard = { href: "/admin", match: "exact" } as const;
const trabalhos = { href: "/admin/trabalhos", match: "prefix" } as const;
const comentarios = { href: "/admin/comentarios", match: "prefix" } as const;

describe("adminNavLinks", () => {
  it("lista apenas as seções (sem a ação 'Novo trabalho') com o match correto", () => {
    expect(adminNavLinks).toEqual([
      { href: "/admin", label: "Dashboard", match: "exact" },
      { href: "/admin/trabalhos", label: "Trabalhos", match: "prefix" },
      { href: "/admin/comentarios", label: "Comentários", match: "prefix" },
    ]);
    expect(adminNavLinks.map((item) => item.label)).not.toContain(
      "Novo trabalho",
    );
  });
});

describe("isAdminNavItemActive", () => {
  describe("Dashboard (/admin, exact)", () => {
    it("é ativo somente em /admin", () => {
      expect(isAdminNavItemActive("/admin", dashboard)).toBe(true);
    });

    it.each([
      "/admin/trabalhos",
      "/admin/trabalhos/novo",
      "/admin/trabalhos/x/editar",
      "/admin/comentarios",
      "/admin/",
    ])("não é ativo em sub-rotas (%s)", (pathname) => {
      expect(isAdminNavItemActive(pathname, dashboard)).toBe(false);
    });
  });

  describe("Trabalhos (/admin/trabalhos, prefix)", () => {
    it.each([
      "/admin/trabalhos",
      "/admin/trabalhos/novo",
      "/admin/trabalhos/x/editar",
    ])("é ativo em %s", (pathname) => {
      expect(isAdminNavItemActive(pathname, trabalhos)).toBe(true);
    });

    it.each(["/admin/trabalhosX", "/admin/trabalhos-antigos", "/admin", "/admin/comentarios"])(
      "não gera falso positivo em %s",
      (pathname) => {
        expect(isAdminNavItemActive(pathname, trabalhos)).toBe(false);
      },
    );
  });

  describe("Comentários (/admin/comentarios, prefix)", () => {
    it.each(["/admin/comentarios", "/admin/comentarios/qualquer"])(
      "é ativo em %s",
      (pathname) => {
        expect(isAdminNavItemActive(pathname, comentarios)).toBe(true);
      },
    );

    it.each(["/admin/comentariosX", "/admin/trabalhos"])(
      "não é ativo em %s",
      (pathname) => {
        expect(isAdminNavItemActive(pathname, comentarios)).toBe(false);
      },
    );
  });

  it("com match exact, não ativa por prefixo mesmo com href diferente de /admin", () => {
    expect(
      isAdminNavItemActive("/admin/trabalhos/novo", {
        href: "/admin/trabalhos",
        match: "exact",
      }),
    ).toBe(false);
  });
});
