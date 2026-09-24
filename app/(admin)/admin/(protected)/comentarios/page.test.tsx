import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import type { CommentFilterStatus } from "./_components/comment-filters";

const panelPropsMock = vi.fn();
const filterPropsMock = vi.fn();

vi.mock("./_components/comment-moderation-panel", () => ({
  CommentModerationPanel: (props: {
    status: CommentFilterStatus;
    page: number;
  }) => {
    panelPropsMock(props);
    return (
      <div data-testid="comment-moderation-panel">
        {props.status}:{props.page}
      </div>
    );
  },
}));

vi.mock("./_components/comment-status-filter", () => ({
  CommentStatusFilter: (props: { current: CommentFilterStatus }) => {
    filterPropsMock(props);
    return <nav data-testid="comment-status-filter">{props.current}</nav>;
  },
}));

import AdminCommentsPage, { metadata } from "./page";

describe("AdminCommentsPage", () => {
  it("nunca é indexável (robots noindex, nofollow)", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("renderiza o h1 'Comentários', o filtro e o painel com os padrões", async () => {
    panelPropsMock.mockClear();
    filterPropsMock.mockClear();

    render(await AdminCommentsPage({ searchParams: Promise.resolve({}) }));

    expect(
      screen.getByRole("heading", { level: 1, name: "Comentários" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("comment-status-filter")).toBeInTheDocument();
    expect(screen.getByTestId("comment-moderation-panel")).toBeInTheDocument();
    expect(filterPropsMock).toHaveBeenCalledWith({ current: "PENDING" });
    expect(panelPropsMock).toHaveBeenCalledWith({ status: "PENDING", page: 1 });
  });

  it("resolve searchParams (Promise) e repassa status/página parseados", async () => {
    panelPropsMock.mockClear();
    filterPropsMock.mockClear();

    render(
      await AdminCommentsPage({
        searchParams: Promise.resolve({ status: "HIDDEN", page: "3" }),
      }),
    );

    expect(filterPropsMock).toHaveBeenCalledWith({ current: "HIDDEN" });
    expect(panelPropsMock).toHaveBeenCalledWith({ status: "HIDDEN", page: 3 });
  });

  it("normaliza valores inválidos da URL", async () => {
    panelPropsMock.mockClear();

    render(
      await AdminCommentsPage({
        searchParams: Promise.resolve({ status: "foo", page: "-2" }),
      }),
    );

    expect(panelPropsMock).toHaveBeenCalledWith({ status: "PENDING", page: 1 });
  });
});
