import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin",
}));

import { AdminMobileNav } from "./admin-mobile-nav";

describe("AdminMobileNav", () => {
  it("abre o drawer com os itens de navegação ao clicar no trigger", async () => {
    const user = userEvent.setup();
    render(<AdminMobileNav />);

    expect(
      screen.queryByRole("link", { name: "Dashboard" }),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Abrir menu de navegação" }),
    );

    expect(
      await screen.findByRole("link", { name: "Dashboard" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Novo trabalho" }),
    ).toBeInTheDocument();
  });

  it("fecha o drawer ao navegar por um item de menu", async () => {
    const user = userEvent.setup();
    render(<AdminMobileNav />);

    await user.click(
      screen.getByRole("button", { name: "Abrir menu de navegação" }),
    );

    const dashboardLink = await screen.findByRole("link", {
      name: "Dashboard",
    });
    await user.click(dashboardLink);

    expect(
      screen.queryByRole("link", { name: "Dashboard" }),
    ).not.toBeInTheDocument();
  });
});
