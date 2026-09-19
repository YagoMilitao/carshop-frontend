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

  it("não renderiza dados de negócio inventados (telefone, endereço, horário, redes sociais)", () => {
    render(<Footer />);

    const footer = screen.getByRole("contentinfo");
    const footerText = footer.textContent ?? "";

    expect(footerText).not.toMatch(/\(\d{3}\)\s?\d{3}-\d{4}/);
    expect(screen.queryByRole("link", { name: /instagram|facebook|twitter|linkedin/i })).not.toBeInTheDocument();
  });

  it("não renderiza o item legado 'Início' e usa os rótulos em inglês do redesign", () => {
    render(<Footer />);

    const institutionalNav = screen.getByRole("navigation", { name: "Links institucionais" });

    expect(within(institutionalNav).queryByRole("link", { name: "Início" })).not.toBeInTheDocument();
    ["Services", "Our Work", "About", "Contact"].forEach((label) => {
      expect(within(institutionalNav).getByRole("link", { name: label })).toBeInTheDocument();
    });
  });
});
