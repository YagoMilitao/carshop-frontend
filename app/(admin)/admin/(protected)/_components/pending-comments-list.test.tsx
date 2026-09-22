import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
  AdminCommentListResponse,
  GetAdminCommentsParams,
} from "@/lib/api/comments.client";

const getAdminCommentsMock =
  vi.fn<(params: GetAdminCommentsParams) => Promise<AdminCommentListResponse>>();

vi.mock("@/lib/api/comments.client", () => ({
  adminCommentsQueryKey: (status?: string, page?: number, limit?: number) => [
    "admin",
    "comments",
    status,
    { page, limit },
  ],
  getAdminComments: (params: GetAdminCommentsParams) =>
    getAdminCommentsMock(params),
}));

import { PendingCommentsList } from "./pending-comments-list";

const pendingComment = {
  id: "c-1",
  workId: "work-1",
  authorName: "Cliente",
  content: "Ficou incrível!",
  status: "PENDING" as const,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

function renderPendingCommentsList() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <PendingCommentsList />
    </QueryClientProvider>,
  );
}

describe("PendingCommentsList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exibe o estado de carregamento", () => {
    getAdminCommentsMock.mockReturnValue(new Promise(() => undefined));

    renderPendingCommentsList();

    expect(screen.getByRole("status")).toHaveTextContent(
      "Carregando comentários pendentes...",
    );
  });

  it("renderiza os comentários pendentes retornados", async () => {
    getAdminCommentsMock.mockResolvedValue({
      items: [pendingComment],
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
    });

    renderPendingCommentsList();

    expect(await screen.findByText("Cliente")).toBeInTheDocument();
    expect(screen.getByText("Ficou incrível!")).toBeInTheDocument();
    expect(screen.getByText("c-1")).toBeInTheDocument();
  });

  it("carrega a próxima página e mantém cada página em uma query distinta", async () => {
    getAdminCommentsMock
      .mockResolvedValueOnce({
        items: [pendingComment],
        page: 1,
        limit: 20,
        total: 21,
        totalPages: 2,
      })
      .mockResolvedValueOnce({
        items: [{ ...pendingComment, id: "c-21", content: "Página dois" }],
        page: 2,
        limit: 20,
        total: 21,
        totalPages: 2,
      });
    const user = userEvent.setup();

    renderPendingCommentsList();

    expect(await screen.findByText("Página 1 de 2")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Próxima" }));

    expect(await screen.findByText("Página dois")).toBeInTheDocument();
    expect(getAdminCommentsMock).toHaveBeenLastCalledWith({
      status: "PENDING",
      page: 2,
      limit: 20,
    });

    await user.click(screen.getByRole("button", { name: "Anterior" }));
    expect(await screen.findByText("Ficou incrível!")).toBeInTheDocument();
  });

  it("exibe mensagem quando não há comentários pendentes", async () => {
    getAdminCommentsMock.mockResolvedValue({
      items: [],
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 1,
    });

    renderPendingCommentsList();

    expect(
      await screen.findByText("Nenhum comentário pendente de moderação."),
    ).toBeInTheDocument();
  });

  it("exibe mensagem amigável quando a listagem falha", async () => {
    getAdminCommentsMock.mockRejectedValue(new Error("network down"));

    renderPendingCommentsList();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Ocorreu um erro inesperado. Tente novamente.",
    );
  });
});
