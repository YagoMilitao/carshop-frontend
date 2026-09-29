import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin",
}));

import { AdminSidebar } from "./admin-sidebar";

describe("AdminSidebar", () => {
  it("renderiza as 4 seções reais de navegação (Dashboard, Trabalhos, Comentários e Imagem da Home), sem a ação 'Novo trabalho'", () => {
    render(<AdminSidebar />);

    const nav = screen.getByRole("navigation", {
      name: "Navegação administrativa",
    });
    const links = screen.getAllByRole("link");

    expect(nav).toBeInTheDocument();
    expect(links).toHaveLength(4);
    expect(links[0]).toHaveAttribute("href", "/admin");
    expect(links[1]).toHaveAttribute("href", "/admin/trabalhos");
    expect(links[2]).toHaveAttribute("href", "/admin/comentarios");
    expect(links[3]).toHaveAttribute("href", "/admin/imagem-da-home");
    expect(links[3]).toHaveTextContent("Imagem da Home");
  });

  it("exibe a marca 'CarShop Admin' e não lista 'Novo trabalho'", () => {
    render(<AdminSidebar />);

    expect(screen.getByText("CarShop Admin")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Novo trabalho" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Novo trabalho")).not.toBeInTheDocument();
  });
});
