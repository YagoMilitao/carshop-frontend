import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { Footer } from "./footer";
import { navLinks } from "./nav-links";

describe("Footer", () => {
  it("renderiza um elemento <footer> semântico", () => {
    render(<Footer />);

    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("renderiza o conteúdo de copyright com o ano atual", () => {
    render(<Footer />);

    const currentYear = new Date().getFullYear();
    expect(
      screen.getByText(`© ${currentYear} CarShop. Todos os direitos reservados.`),
    ).toBeInTheDocument();
  });

  it("renderiza os links institucionais (navLinks) com hrefs corretos", () => {
    render(<Footer />);

    const institutionalNav = screen.getByRole("navigation", { name: "Links institucionais" });

    navLinks.forEach((link) => {
      const anchor = within(institutionalNav).getByRole("link", { name: link.label });
      expect(anchor).toHaveAttribute("href", link.href);
    });
  });
});
