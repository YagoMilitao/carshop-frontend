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

  it("renderiza o MobileNav (botão de abrir/fechar menu)", () => {
    render(<Header />);

    expect(
      screen.getByRole("button", { name: "Abrir menu de navegação" }),
    ).toBeInTheDocument();
  });
});
