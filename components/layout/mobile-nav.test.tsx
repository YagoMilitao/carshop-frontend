import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MobileNav } from "./mobile-nav";
import { navLinks } from "./nav-links";

describe("MobileNav", () => {
  it("inicia fechado, com aria-expanded=false e o rótulo de abrir", () => {
    render(<MobileNav />);

    const toggle = screen.getByRole("button", { name: "Abrir menu de navegação" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveAttribute("aria-controls", "mobile-nav-panel");
  });

  it("abre o menu ao clicar no botão hambúrguer (aria-expanded vira true)", async () => {
    const user = userEvent.setup();
    render(<MobileNav />);

    const toggle = screen.getByRole("button", { name: "Abrir menu de navegação" });
    await user.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: "Fechar menu de navegação" })).toBeInTheDocument();
  });

  it("fecha o menu ao clicar novamente no botão", async () => {
    const user = userEvent.setup();
    render(<MobileNav />);

    const toggle = screen.getByRole("button", { name: "Abrir menu de navegação" });
    await user.click(toggle);
    await user.click(screen.getByRole("button", { name: "Fechar menu de navegação" }));

    expect(screen.getByRole("button", { name: "Abrir menu de navegação" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("renderiza todos os links de navLinks no menu mobile e fecha o menu ao clicar em um link", async () => {
    const user = userEvent.setup();
    render(<MobileNav />);

    await user.click(screen.getByRole("button", { name: "Abrir menu de navegação" }));

    const mobileNav = screen.getByRole("navigation", { name: "Navegação principal (mobile)" });
    navLinks.forEach((link) => {
      const anchor = within(mobileNav).getByRole("link", { name: link.label });
      expect(anchor).toHaveAttribute("href", link.href);
    });

    await user.click(within(mobileNav).getByRole("link", { name: navLinks[0].label }));

    expect(screen.getByRole("button", { name: "Abrir menu de navegação" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });
});
