import { describe, expect, it } from "vitest";
import { navLinks } from "./nav-links";

describe("navLinks", () => {
  it("expõe exatamente os 4 links institucionais em inglês, na ordem definida pelo design", () => {
    expect(navLinks).toEqual([
      { href: "/services", label: "Services" },
      { href: "/portfolio", label: "Our Work" },
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
    ]);
  });

  it("não inclui um item de Home/Início (logo já cobre o acesso à home)", () => {
    const labels = navLinks.map((link) => link.label.toLowerCase());
    const hrefs = navLinks.map((link) => link.href);

    expect(labels).not.toContain("início");
    expect(labels).not.toContain("home");
    expect(hrefs).not.toContain("/");
  });

  it("não contém rótulos em português (regressão do redesign CARSHOP-143)", () => {
    const legacyPtBrLabels = ["Início", "Sobre", "Serviços", "Portfólio", "Contato"];

    navLinks.forEach((link) => {
      expect(legacyPtBrLabels).not.toContain(link.label);
    });
  });

  it("mantém as rotas reais já existentes no repositório (nenhuma rota nova/inexistente)", () => {
    const knownRoutes = ["/services", "/portfolio", "/about", "/contact"];

    navLinks.forEach((link) => {
      expect(knownRoutes).toContain(link.href);
    });
  });
});
