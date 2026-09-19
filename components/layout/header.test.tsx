import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { Header } from "./header";
import { navLinks } from "./nav-links";

describe("Header", () => {
  it("renderiza um elemento <header> semântico", () => {
    render(<Header />);

    expect(screen.getByRole("banner")).toBeInTheDocument();
  });

  it("renderiza o link para a home com o nome da marca", () => {
    render(<Header />);

    const brandLink = screen.getByRole("link", { name: "CarShop" });
    expect(brandLink).toHaveAttribute("href", "/");
  });

  it("renderiza todos os links de navLinks na navegação desktop com hrefs corretos", () => {
    render(<Header />);

    const desktopNav = screen.getByRole("navigation", { name: "Navegação principal" });

    navLinks.forEach((link) => {
      const anchor = within(desktopNav).getByRole("link", { name: link.label });
      expect(anchor).toHaveAttribute("href", link.href);
    });
  });

  it("não renderiza o item legado 'Início' e usa os rótulos em inglês do redesign", () => {
    render(<Header />);

    const desktopNav = screen.getByRole("navigation", { name: "Navegação principal" });

    expect(within(desktopNav).queryByRole("link", { name: "Início" })).not.toBeInTheDocument();
    ["Services", "Our Work", "About", "Contact"].forEach((label) => {
      expect(within(desktopNav).getByRole("link", { name: label })).toBeInTheDocument();
    });
  });

  it("renderiza o MobileNav (botão de abrir/fechar menu)", () => {
    render(<Header />);

    expect(
      screen.getByRole("button", { name: "Abrir menu de navegação" }),
    ).toBeInTheDocument();
  });

  it("renderiza o CTA 'Get a Quote' desabilitado, sem destino funcional", () => {
    render(<Header />);

    // O CTA aparece duas vezes no DOM: uma na área desktop (hidden md:flex)
    // e outra dentro do painel do MobileNav (ver mobile-nav.test.tsx).
    const ctaButtons = screen.getAllByRole("button", { name: "Get a Quote (coming soon)" });
    expect(ctaButtons.length).toBeGreaterThan(0);

    ctaButtons.forEach((cta) => {
      expect(cta).toBeDisabled();
      expect(cta).toHaveAttribute("aria-disabled", "true");
      expect(cta.tagName).toBe("BUTTON");
      expect(cta).not.toHaveAttribute("href");
    });
  });

  it("agrupa navegação desktop e CTA num bloco visível apenas a partir de md (hidden md:flex)", () => {
    render(<Header />);

    const desktopNav = screen.getByRole("navigation", { name: "Navegação principal" });
    const desktopGroup = desktopNav.parentElement as HTMLElement;

    expect(desktopGroup.className).toContain("hidden");
    expect(desktopGroup.className).toContain("md:flex");
  });

  it("aplica foco visível acessível (focus-visible:ring) em todos os links de navegação desktop e no CTA", () => {
    render(<Header />);

    const desktopNav = screen.getByRole("navigation", { name: "Navegação principal" });
    within(desktopNav)
      .getAllByRole("link")
      .forEach((link) => {
        expect(link.className).toContain("focus-visible:ring");
      });

    const [desktopCta] = screen.getAllByRole("button", { name: "Get a Quote (coming soon)" });
    expect(desktopCta.className).toMatch(/focus-visible:ring|ring-\[3px\]/);
  });

  it("mantém os links de navegação alcançáveis por teclado (não são desabilitados nem possuem tabIndex negativo)", () => {
    render(<Header />);

    const desktopNav = screen.getByRole("navigation", { name: "Navegação principal" });
    within(desktopNav)
      .getAllByRole("link")
      .forEach((link) => {
        expect(link).not.toHaveAttribute("tabindex", "-1");
      });
  });
});
