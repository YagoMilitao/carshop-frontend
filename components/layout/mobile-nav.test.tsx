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

  it("renderiza o trigger como um botão acessível com touch target adequado", () => {
    render(<MobileNav />);

    const toggle = screen.getByRole("button", { name: "Abrir menu de navegação" });
    expect(toggle.tagName).toBe("BUTTON");
    expect(toggle).toHaveAttribute("data-slot", "button");
    expect(toggle.className).toContain("size-11");
  });

  it("renderiza o CTA 'Get a Quote' desabilitado dentro do painel mobile", async () => {
    const user = userEvent.setup();
    render(<MobileNav />);

    await user.click(screen.getByRole("button", { name: "Abrir menu de navegação" }));

    const panel = screen.getByRole("navigation", { name: "Navegação principal (mobile)" })
      .parentElement as HTMLElement;
    const cta = within(panel).getByRole("button", { name: "Get a Quote (coming soon)" });

    expect(cta).toBeDisabled();
    expect(cta).toHaveAttribute("aria-disabled", "true");
  });

  it("renderiza o container do MobileNav oculto a partir de md (md:hidden), visível apenas no mobile", () => {
    const { container } = render(<MobileNav />);

    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.className).toContain("md:hidden");
  });

  it("aplica foco visível acessível (focus-visible:ring) no trigger e nos links do painel mobile", async () => {
    const user = userEvent.setup();
    render(<MobileNav />);

    const toggle = screen.getByRole("button", { name: "Abrir menu de navegação" });
    expect(toggle.className).toContain("focus-visible:ring");

    await user.click(toggle);

    const mobileNav = screen.getByRole("navigation", { name: "Navegação principal (mobile)" });
    within(mobileNav)
      .getAllByRole("link")
      .forEach((link) => {
        expect(link.className).toContain("focus-visible:ring");
      });
  });
});
