import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { AdminPageHeader } from "./admin-page-header";

describe("AdminPageHeader", () => {
  it("renderiza o título como único h1, sem descrição nem ações", () => {
    const { container } = render(<AdminPageHeader title="Dashboard" />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Dashboard" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("heading")).toHaveLength(1);
    expect(container.querySelector("p")).toBeNull();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("renderiza descrição e ações quando fornecidas", () => {
    render(
      <AdminPageHeader
        title="Trabalhos"
        description="Gerencie o portfólio."
        actions={<a href="/admin/trabalhos/novo">Novo trabalho</a>}
      />,
    );

    expect(screen.getByText("Gerencie o portfólio.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Novo trabalho" })).toHaveAttribute(
      "href",
      "/admin/trabalhos/novo",
    );
  });
});
