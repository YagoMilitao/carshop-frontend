import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin",
}));

import { AdminSidebar } from "./admin-sidebar";

describe("AdminSidebar", () => {
  it("renderiza apenas os 2 itens reais de navegação (Dashboard e Novo trabalho)", () => {
    render(<AdminSidebar />);

    const nav = screen.getByRole("navigation", {
      name: "Navegação administrativa",
    });
    const links = screen.getAllByRole("link");

    expect(nav).toBeInTheDocument();
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute("href", "/admin");
    expect(links[1]).toHaveAttribute("href", "/admin/trabalhos/novo");
  });
});
