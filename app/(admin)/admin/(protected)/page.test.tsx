import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import type { Work } from "@/lib/api/works";

/**
 * `./page` importa `lib/api/works.ts` (`import "server-only"`, `fetch`
 * server-side) — mockado como no-op para permitir importar o módulo sob
 * Vitest/jsdom, mesmo padrão de `lib/api/works.test.ts`. Os três
 * componentes filhos (`CreateWorkForm`, `WorkListItem`,
 * `CommentModerationForm`) são "use client" com sua própria cobertura
 * dedicada (`create-work-form.test.tsx`, `work-list-item.test.tsx`,
 * `comment-moderation-form.test.tsx`) — mockados aqui como stubs simples
 * para isolar apenas a lógica de data-fetching/composição desta page.
 */
vi.mock("server-only", () => ({}));

const getWorksMock = vi.fn<() => Promise<Work[]>>();

vi.mock("@/lib/api/works", () => ({
  getWorks: () => getWorksMock(),
}));

vi.mock("./create-work-form", () => ({
  CreateWorkForm: () => <div data-testid="create-work-form" />,
}));

vi.mock("./work-list-item", () => ({
  WorkListItem: ({ work }: { work: Work }) => (
    <li data-testid="work-list-item">{work.title}</li>
  ),
}));

vi.mock("./comment-moderation-form", () => ({
  CommentModerationForm: () => <div data-testid="comment-moderation-form" />,
}));

const baseWork: Work = {
  id: "1",
  slug: "restauracao-fusca",
  title: "Restauração Fusca",
  description: "Descrição",
  category: "Estofamento",
  tags: ["fusca"],
  images: [],
  status: "published",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
  deletedAt: null,
};

describe("AdminPage (protegida)", () => {
  it("nunca é indexável (robots noindex, nofollow)", async () => {
    const { metadata } = await import("./page");

    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("busca works via getWorks() e renderiza um WorkListItem por work", async () => {
    getWorksMock.mockResolvedValue([
      baseWork,
      { ...baseWork, id: "2", title: "Outro Work" },
    ]);
    const { default: AdminPage } = await import("./page");

    render(await AdminPage());

    expect(screen.getAllByTestId("work-list-item")).toHaveLength(2);
    expect(screen.getByText("Restauração Fusca")).toBeInTheDocument();
    expect(screen.getByText("Outro Work")).toBeInTheDocument();
  });

  it("exibe mensagem de lista vazia quando não há works cadastrados", async () => {
    getWorksMock.mockResolvedValue([]);
    const { default: AdminPage } = await import("./page");

    render(await AdminPage());

    expect(
      screen.getByText("Nenhum work cadastrado."),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("work-list-item")).not.toBeInTheDocument();
  });

  it("renderiza CreateWorkForm e CommentModerationForm", async () => {
    getWorksMock.mockResolvedValue([]);
    const { default: AdminPage } = await import("./page");

    render(await AdminPage());

    expect(screen.getByTestId("create-work-form")).toBeInTheDocument();
    expect(screen.getByTestId("comment-moderation-form")).toBeInTheDocument();
  });
});
