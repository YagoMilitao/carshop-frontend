import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("./admin-work-list", () => ({
  AdminWorkList: () => <div data-testid="admin-work-list" />,
}));

import AdminWorksPage, { metadata } from "./page";

describe("AdminWorksPage (protegida)", () => {
  it("nunca é indexável (robots noindex, nofollow)", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("renderiza o título 'Trabalhos' e delega a listagem ao AdminWorkList", () => {
    render(<AdminWorksPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Trabalhos" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("admin-work-list")).toBeInTheDocument();
    expect(screen.queryByRole("main")).not.toBeInTheDocument();
  });

  it("renderiza o link 'Novo trabalho' apontando para /admin/trabalhos/novo", () => {
    render(<AdminWorksPage />);

    expect(
      screen.getByRole("link", { name: "Novo trabalho" }),
    ).toHaveAttribute("href", "/admin/trabalhos/novo");
  });
});
