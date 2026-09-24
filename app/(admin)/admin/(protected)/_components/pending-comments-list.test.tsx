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

const useAdminWorkTitlesMock = vi.fn<
  () => ReadonlyMap<string, string> | undefined
>();

vi.mock("./use-admin-work-titles", () => ({
  useAdminWorkTitles: () => useAdminWorkTitlesMock(),
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
    useAdminWorkTitlesMock.mockReturnValue(
      new Map([["work-1", "Restauração Fusca"]]),
    );
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
    expect(
      screen.getByText("Trabalho: Restauração Fusca"),
    ).toBeInTheDocument();
    expect(screen.queryByText("c-1")).not.toBeInTheDocument();
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

  it("exibe o título do trabalho, a data pt-BR e não exibe IDs crus do comentário", async () => {
    getAdminCommentsMock.mockResolvedValue({
      items: [pendingComment],
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
    });

    const { container } = renderPendingCommentsList();

    expect(
      await screen.findByText("Trabalho: Restauração Fusca"),
    ).toBeInTheDocument();
    expect(container.querySelector("code")).toBeNull();
    expect(screen.queryByText(/work-1/)).not.toBeInTheDocument();
    expect(screen.queryByText(/ID do comentário/)).not.toBeInTheDocument();
    expect(container).not.toHaveTextContent("c-1");

    const time = container.querySelector("time");
    expect(time).toHaveAttribute("dateTime", pendingComment.createdAt);
    expect(time).toHaveTextContent(
      new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(pendingComment.createdAt)),
    );
  });

  it.each([
    ["títulos ainda não carregados", undefined],
    ["work ausente do mapa", new Map([["outro-work", "Outro"]])],
  ] as const)(
    "usa o workId em <code> como fallback (%s)",
    async (_caso, titles) => {
      useAdminWorkTitlesMock.mockReturnValue(titles);
      getAdminCommentsMock.mockResolvedValue({
        items: [pendingComment],
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      });

      renderPendingCommentsList();

      const code = await screen.findByText("work-1");
      expect(code.tagName).toBe("CODE");
      expect(code.parentElement).toHaveTextContent("Trabalho: work-1");
      expect(screen.queryByText(/ID do comentário/)).not.toBeInTheDocument();
    },
  );

  it("permite tentar novamente após erro e exibe os comentários ao recuperar", async () => {
    getAdminCommentsMock
      .mockRejectedValueOnce(new Error("network down"))
      .mockResolvedValueOnce({
        items: [pendingComment],
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      });
    const user = userEvent.setup();

    renderPendingCommentsList();

    await screen.findByRole("alert");
    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));

    expect(await screen.findByText("Ficou incrível!")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(getAdminCommentsMock).toHaveBeenCalledTimes(2);
  });

  it("exibe o estado vazio da página quando uma página > 1 vem sem itens", async () => {
    getAdminCommentsMock
      .mockResolvedValueOnce({
        items: [pendingComment],
        page: 1,
        limit: 20,
        total: 21,
        totalPages: 2,
      })
      .mockResolvedValueOnce({
        items: [],
        page: 2,
        limit: 20,
        total: 20,
        totalPages: 1,
      });
    const user = userEvent.setup();

    renderPendingCommentsList();

    await screen.findByText("Página 1 de 2");
    await user.click(screen.getByRole("button", { name: "Próxima" }));

    expect(
      await screen.findByText("Nenhum comentário nesta página."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Anterior" })).toBeEnabled();
  });
});
