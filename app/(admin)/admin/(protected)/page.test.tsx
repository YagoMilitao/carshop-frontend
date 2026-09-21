import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("./admin-work-list", () => ({
  AdminWorkList: () => <div data-testid="admin-work-list" />,
}));

vi.mock("./comment-moderation-form", () => ({
  CommentModerationForm: () => <div data-testid="comment-moderation-form" />,
}));

describe("AdminPage (protegida)", () => {
  it("nunca é indexável (robots noindex, nofollow)", async () => {
    const { metadata } = await import("./page");

    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("delega a listagem autenticada ao AdminWorkList", async () => {
    const { default: AdminPage } = await import("./page");

    render(<AdminPage />);

    expect(screen.getByTestId("admin-work-list")).toBeInTheDocument();
  });

  it("renderiza o link para /admin/trabalhos/novo e o CommentModerationForm", async () => {
    const { default: AdminPage } = await import("./page");

    render(<AdminPage />);

    expect(
      screen.getByRole("link", { name: "Novo trabalho" }),
    ).toHaveAttribute("href", "/admin/trabalhos/novo");
    expect(screen.getByTestId("comment-moderation-form")).toBeInTheDocument();
  });
});
