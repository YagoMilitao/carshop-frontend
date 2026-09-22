import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("./admin-work-list", () => ({
  AdminWorkList: () => <div data-testid="admin-work-list" />,
}));

vi.mock("./comment-moderation-form", () => ({
  CommentModerationForm: () => <div data-testid="comment-moderation-form" />,
}));

vi.mock("./_components/dashboard-summary", () => ({
  DashboardSummary: () => <div data-testid="dashboard-summary" />,
}));

vi.mock("./_components/pending-comments-list", () => ({
  PendingCommentsList: () => <div data-testid="pending-comments-list" />,
}));

describe("AdminPage (protegida)", () => {
  it("nunca é indexável (robots noindex, nofollow)", async () => {
    const { metadata } = await import("./page");

    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("renderiza o título 'Dashboard' e delega a listagem autenticada ao AdminWorkList", async () => {
    const { default: AdminPage } = await import("./page");

    render(<AdminPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Dashboard" }),
    ).toBeInTheDocument();
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

  it("renderiza DashboardSummary (visão geral) e PendingCommentsList (comentários pendentes)", async () => {
    const { default: AdminPage } = await import("./page");

    render(<AdminPage />);

    expect(screen.getByTestId("dashboard-summary")).toBeInTheDocument();
    expect(screen.getByTestId("pending-comments-list")).toBeInTheDocument();
  });
});
