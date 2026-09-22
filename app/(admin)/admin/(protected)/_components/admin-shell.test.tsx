import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("./admin-sidebar", () => ({
  AdminSidebar: () => <div data-testid="admin-sidebar" />,
}));

vi.mock("./admin-header", () => ({
  AdminHeader: () => <div data-testid="admin-header" />,
}));

import { AdminShell } from "./admin-shell";

describe("AdminShell", () => {
  it("renderiza sidebar, header e children dentro do landmark <main>", () => {
    render(
      <AdminShell>
        <p>conteúdo da página admin</p>
      </AdminShell>,
    );

    expect(screen.getByTestId("admin-sidebar")).toBeInTheDocument();
    expect(screen.getByTestId("admin-header")).toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveTextContent(
      "conteúdo da página admin",
    );
  });
});
