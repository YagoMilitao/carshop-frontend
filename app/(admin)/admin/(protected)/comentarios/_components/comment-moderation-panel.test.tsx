import { AxiosError, AxiosHeaders } from "axios";
import type { InternalAxiosRequestConfig } from "axios";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Comment } from "@/lib/api/comments";
import type {
  AdminCommentListResponse,
  GetAdminCommentsParams,
  UpdateCommentPayload,
} from "@/lib/api/comments.client";
import type { Work } from "@/lib/api/works";

import type { CommentFilterStatus } from "./comment-filters";

const getAdminCommentsMock =
  vi.fn<(params: GetAdminCommentsParams) => Promise<AdminCommentListResponse>>();
const deleteCommentMock = vi.fn<(id: string) => Promise<void>>();
const approveCommentMock = vi.fn<(id: string) => Promise<Comment>>();
const updateCommentMock =
  vi.fn<(id: string, payload: UpdateCommentPayload) => Promise<Comment>>();
const getAdminWorksMock = vi.fn<() => Promise<Work[]>>();
const syncMock = vi.fn<(client: QueryClient, workId: string) => Promise<void>>();
const toastSuccessMock = vi.fn();
const toastErrorMock = vi.fn();

vi.mock("@/lib/api/comments.client", () => ({
  adminCommentsBaseQueryKey: ["admin", "comments"],
  adminCommentsQueryKey: (status?: string, page?: number, limit?: number) => [
    "admin",
    "comments",
    status,
    { page, limit },
  ],
  getAdminComments: (params: GetAdminCommentsParams) =>
    getAdminCommentsMock(params),
  deleteComment: (id: string) => deleteCommentMock(id),
  approveComment: (id: string) => approveCommentMock(id),
  updateComment: (id: string, payload: UpdateCommentPayload) =>
    updateCommentMock(id, payload),
}));

vi.mock("@/lib/api/works.client", () => ({
  adminWorksQueryKey: ["admin", "works"],
  getAdminWorks: () => getAdminWorksMock(),
}));

vi.mock("./comment-moderation-sync", () => ({
  syncAfterCommentMutation: (client: QueryClient, workId: string) =>
    syncMock(client, workId),
}));

vi.mock("sonner", () => ({
  toast: {
    success: (message: string) => toastSuccessMock(message),
    error: (message: string) => toastErrorMock(message),
  },
}));

import { COMMENTS_PER_PAGE, CommentModerationPanel } from "./comment-moderation-panel";

const comment: Comment = {
  id: "c-1",
  workId: "work-1",
  authorName: "Cliente",
  content: "Ficou incrível!",
  status: "PENDING",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

const work: Work = {
  id: "work-1",
  slug: "restauracao-fusca",
  title: "Restauração Fusca",
  description: "Descrição",
  category: "Estofamento",
  tags: [],
  images: [],
  status: "published",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
  deletedAt: null,
};

function listResponse(
  items: Comment[],
  overrides: Partial<AdminCommentListResponse> = {},
): AdminCommentListResponse {
  return {
    items,
    page: 1,
    limit: COMMENTS_PER_PAGE,
    total: items.length,
    totalPages: items.length > 0 ? 1 : 0,
    ...overrides,
  };
}

function createAxiosError(status: number, message = "Mensagem do backend") {
  const config: InternalAxiosRequestConfig = { headers: new AxiosHeaders() };

  return new AxiosError(message, "ERR_BAD_REQUEST", config, undefined, {
    status,
    statusText: String(status),
    headers: new AxiosHeaders(),
    config,
    data: { message },
  });
}

let queryClient: QueryClient;

function renderPanel(status: CommentFilterStatus = "PENDING", page = 1) {
  return render(
    <QueryClientProvider client={queryClient}>
      <CommentModerationPanel status={status} page={page} />
    </QueryClientProvider>,
  );
}

describe("CommentModerationPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    getAdminWorksMock.mockResolvedValue([work]);
    syncMock.mockResolvedValue(undefined);
  });

  describe("listagem", () => {
    it("exibe o estado de carregamento", () => {
      getAdminCommentsMock.mockReturnValue(new Promise(() => undefined));

      renderPanel();

      expect(screen.getByRole("status")).toHaveTextContent(
        "Carregando comentários...",
      );
      expect(
        screen.getByRole("heading", { level: 2, name: "Comentários pendentes" }),
      ).toBeInTheDocument();
    });

    it.each([
      [401, "Sua sessão expirou. Faça login novamente."],
      [429, "Muitas tentativas. Aguarde alguns instantes e tente novamente."],
      [500, "Falha ao listar"],
    ] as const)(
      "exibe o erro %i da listagem com role='alert'",
      async (status, expectedMessage) => {
        getAdminCommentsMock.mockRejectedValue(
          createAxiosError(status, "Falha ao listar"),
        );

        renderPanel();

        expect(await screen.findByRole("alert")).toHaveTextContent(
          expectedMessage,
        );
        expect(screen.queryByRole("status")).not.toBeInTheDocument();
      },
    );

    it("consulta a API com status, página e limite", async () => {
      getAdminCommentsMock.mockResolvedValue(listResponse([comment]));

      renderPanel("APPROVED", 1);

      await screen.findByRole("list");
      expect(getAdminCommentsMock).toHaveBeenCalledWith({
        status: "APPROVED",
        page: 1,
        limit: 20,
      });
    });

    it("ALL → chama a API com status undefined", async () => {
      getAdminCommentsMock.mockResolvedValue(listResponse([]));

      renderPanel("ALL");

      expect(
        await screen.findByText("Nenhum comentário recebido até o momento."),
      ).toBeInTheDocument();
      expect(getAdminCommentsMock).toHaveBeenCalledWith({
        status: undefined,
        page: 1,
        limit: 20,
      });
      expect(
        screen.getByRole("heading", { name: "Todos os comentários (0)" }),
      ).toBeInTheDocument();
    });

    it.each([
      ["PENDING", "Nenhum comentário pendente de moderação."],
      ["APPROVED", "Nenhum comentário aprovado."],
      ["HIDDEN", "Nenhum comentário oculto."],
      ["ALL", "Nenhum comentário recebido até o momento."],
    ] as const)("estado vazio para %s", async (status, message) => {
      getAdminCommentsMock.mockResolvedValue(listResponse([]));

      renderPanel(status);

      expect(await screen.findByText(message)).toBeInTheDocument();
      expect(screen.queryByRole("list")).not.toBeInTheDocument();
      expect(
        screen.queryByRole("navigation", { name: "Paginação de comentários" }),
      ).not.toBeInTheDocument();
      const hiddenNotice = screen.queryByText(
        "Ocultar comentários ainda não está disponível no painel.",
      );
      if (status === "HIDDEN") {
        expect(hiddenNotice).toBeInTheDocument();
      } else {
        expect(hiddenNotice).not.toBeInTheDocument();
      }
    });

    it("estado vazio em página > 1 com paginação para voltar", async () => {
      getAdminCommentsMock.mockResolvedValue(
        listResponse([], { page: 5, total: 20, totalPages: 1 }),
      );

      renderPanel("APPROVED", 5);

      expect(
        await screen.findByText("Nenhum comentário nesta página."),
      ).toBeInTheDocument();
      expect(
        screen.queryByText("Nenhum comentário aprovado."),
      ).not.toBeInTheDocument();
      const nav = screen.getByRole("navigation", {
        name: "Paginação de comentários",
      });
      expect(within(nav).getByRole("link", { name: "Anterior" })).toHaveAttribute(
        "href",
        "/admin/comentarios?status=APPROVED&page=4",
      );
      expect(within(nav).getByRole("button", { name: "Próxima" })).toBeDisabled();
    });

    it("exibe o título do work quando resolvido e o total no heading", async () => {
      getAdminCommentsMock.mockResolvedValue(listResponse([comment]));

      renderPanel();

      expect(
        await screen.findByText("Trabalho: Restauração Fusca"),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: "Comentários pendentes (1)" }),
      ).toBeInTheDocument();
    });

    it("usa o workId como fallback quando o título não está disponível", async () => {
      getAdminWorksMock.mockRejectedValue(new Error("falha"));
      getAdminCommentsMock.mockResolvedValue(
        listResponse([{ ...comment, workId: "work-sem-titulo" }]),
      );

      renderPanel();

      const code = await screen.findByText("work-sem-titulo");
      expect(code.tagName).toBe("CODE");
    });

    it("não exibe paginação com uma única página", async () => {
      getAdminCommentsMock.mockResolvedValue(listResponse([comment]));

      renderPanel();

      await screen.findByRole("list");
      expect(
        screen.queryByRole("navigation", { name: "Paginação de comentários" }),
      ).not.toBeInTheDocument();
    });

    it("primeira página: Anterior desabilitado e Próxima com href", async () => {
      getAdminCommentsMock.mockResolvedValue(
        listResponse([comment], { total: 45, totalPages: 3 }),
      );

      renderPanel("PENDING", 1);

      const nav = await screen.findByRole("navigation", {
        name: "Paginação de comentários",
      });
      expect(within(nav).getByRole("button", { name: "Anterior" })).toBeDisabled();
      expect(within(nav).getByText("Página 1 de 3")).toBeInTheDocument();
      expect(within(nav).getByRole("link", { name: "Próxima" })).toHaveAttribute(
        "href",
        "/admin/comentarios?page=2",
      );
    });

    it("página do meio: hrefs de Anterior/Próxima preservam o status", async () => {
      getAdminCommentsMock.mockResolvedValue(
        listResponse([comment], { page: 2, total: 45, totalPages: 3 }),
      );

      renderPanel("HIDDEN", 2);

      const nav = await screen.findByRole("navigation", {
        name: "Paginação de comentários",
      });
      expect(within(nav).getByRole("link", { name: "Anterior" })).toHaveAttribute(
        "href",
        "/admin/comentarios?status=HIDDEN",
      );
      expect(within(nav).getByRole("link", { name: "Próxima" })).toHaveAttribute(
        "href",
        "/admin/comentarios?status=HIDDEN&page=3",
      );
      expect(within(nav).getByText("Página 2 de 3")).toBeInTheDocument();
    });

    it("última página: Próxima desabilitado", async () => {
      getAdminCommentsMock.mockResolvedValue(
        listResponse([comment], { page: 3, total: 45, totalPages: 3 }),
      );

      renderPanel("ALL", 3);

      const nav = await screen.findByRole("navigation", {
        name: "Paginação de comentários",
      });
      expect(within(nav).getByRole("button", { name: "Próxima" })).toBeDisabled();
      expect(within(nav).getByRole("link", { name: "Anterior" })).toHaveAttribute(
        "href",
        "/admin/comentarios?status=ALL&page=2",
      );
    });
  });

  describe("fluxo de exclusão", () => {
    async function openDeleteDialog() {
      const user = userEvent.setup();
      getAdminCommentsMock.mockResolvedValue(listResponse([comment]));
      renderPanel();

      const trigger = await screen.findByRole("button", {
        name: /^Excluir comentário de Cliente$/,
      });
      await user.click(trigger);
      await screen.findByRole("alertdialog");

      return { user, trigger };
    }

    it("abre o diálogo com autor e trecho", async () => {
      await openDeleteDialog();

      expect(screen.getByRole("alertdialog")).toHaveAccessibleDescription(
        "Tem certeza que deseja excluir o comentário de Cliente (“Ficou incrível!”)? Essa ação não pode ser desfeita.",
      );
    });

    it("cancelar fecha sem chamar a API e devolve o foco ao botão", async () => {
      const { user, trigger } = await openDeleteDialog();

      await user.click(screen.getByRole("button", { name: "Cancelar" }));

      await waitFor(() =>
        expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument(),
      );
      expect(deleteCommentMock).not.toHaveBeenCalled();
      await waitFor(() => expect(trigger).toHaveFocus());
    });

    it("exibe 'Excluindo...' e não fecha com Esc durante o pending", async () => {
      deleteCommentMock.mockReturnValue(new Promise(() => undefined));
      const { user } = await openDeleteDialog();

      await user.click(
        screen.getByRole("button", { name: "Excluir comentário" }),
      );

      expect(
        await screen.findByRole("button", { name: "Excluindo..." }),
      ).toBeDisabled();
      expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();

      await user.keyboard("{Escape}");
      expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    });

    it("sucesso: chama DELETE, sincroniza, exibe toast, fecha e foca o heading", async () => {
      deleteCommentMock.mockResolvedValue(undefined);
      const { user } = await openDeleteDialog();

      await user.click(
        screen.getByRole("button", { name: "Excluir comentário" }),
      );

      await waitFor(() =>
        expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument(),
      );
      expect(deleteCommentMock).toHaveBeenCalledWith("c-1");
      expect(syncMock).toHaveBeenCalledWith(queryClient, "work-1");
      expect(toastSuccessMock).toHaveBeenCalledWith("Comentário excluído.");
      await waitFor(() =>
        expect(
          screen.getByRole("heading", { name: /Comentários pendentes/ }),
        ).toHaveFocus(),
      );
    });

    it("404: exibe o erro, remove a confirmação (só 'Fechar') e invalida a lista", async () => {
      deleteCommentMock.mockRejectedValue(createAxiosError(404));
      const { user } = await openDeleteDialog();
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      await user.click(
        screen.getByRole("button", { name: "Excluir comentário" }),
      );

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Comentário não encontrado. Ele pode ter sido removido; a lista será atualizada.",
      );
      expect(
        screen.queryByRole("button", { name: "Excluir comentário" }),
      ).not.toBeInTheDocument();
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["admin", "comments"],
      });
      expect(syncMock).not.toHaveBeenCalled();
      expect(toastSuccessMock).not.toHaveBeenCalled();

      await user.click(screen.getByRole("button", { name: "Fechar" }));
      await waitFor(() =>
        expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument(),
      );
    });

    it("429: exibe o erro e permite nova tentativa bem-sucedida", async () => {
      deleteCommentMock
        .mockRejectedValueOnce(createAxiosError(429))
        .mockResolvedValueOnce(undefined);
      const { user } = await openDeleteDialog();

      await user.click(
        screen.getByRole("button", { name: "Excluir comentário" }),
      );

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Muitas tentativas. Aguarde alguns instantes e tente novamente.",
      );
      const retry = screen.getByRole("button", { name: "Excluir comentário" });
      expect(retry).toBeEnabled();

      await user.click(retry);

      await waitFor(() =>
        expect(toastSuccessMock).toHaveBeenCalledWith("Comentário excluído."),
      );
      expect(deleteCommentMock).toHaveBeenCalledTimes(2);
    });

    it("reabrir após erro começa limpo (sem alerta, com confirmação)", async () => {
      deleteCommentMock.mockRejectedValue(createAxiosError(404));
      const { user, trigger } = await openDeleteDialog();

      await user.click(
        screen.getByRole("button", { name: "Excluir comentário" }),
      );
      await screen.findByRole("alert");
      await user.click(screen.getByRole("button", { name: "Fechar" }));
      await waitFor(() =>
        expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument(),
      );

      await user.click(trigger);

      await screen.findByRole("alertdialog");
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Excluir comentário" }),
      ).toBeEnabled();
    });
  });

  describe("fluxo de edição", () => {
    async function openEditDialog() {
      const user = userEvent.setup();
      getAdminCommentsMock.mockResolvedValue(listResponse([comment]));
      renderPanel();

      const trigger = await screen.findByRole("button", {
        name: /^Editar comentário de Cliente$/,
      });
      await user.click(trigger);
      await screen.findByRole("dialog", { name: "Editar comentário" });

      return { user, trigger };
    }

    it("abre com os dados do comentário e cancelar devolve o foco ao botão", async () => {
      const { user, trigger } = await openEditDialog();

      expect(screen.getByLabelText("Autor")).toHaveValue("Cliente");

      await user.click(screen.getByRole("button", { name: "Cancelar" }));

      await waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
      );
      await waitFor(() => expect(trigger).toHaveFocus());
      expect(updateCommentMock).not.toHaveBeenCalled();
    });

    it("sucesso: fecha e foca o heading da listagem", async () => {
      updateCommentMock.mockResolvedValue({ ...comment, authorName: "Ana" });
      const { user } = await openEditDialog();

      const author = screen.getByLabelText("Autor");
      await user.clear(author);
      await user.type(author, "Ana");
      await user.click(screen.getByRole("button", { name: "Salvar" }));

      await waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
      );
      expect(updateCommentMock).toHaveBeenCalledWith("c-1", { authorName: "Ana" });
      expect(toastSuccessMock).toHaveBeenCalledWith("Comentário atualizado.");
      await waitFor(() =>
        expect(
          screen.getByRole("heading", { name: /Comentários pendentes/ }),
        ).toHaveFocus(),
      );
    });

    it("404: invalida a lista pela chave base", async () => {
      updateCommentMock.mockRejectedValue(createAxiosError(404));
      const { user } = await openEditDialog();
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      await user.selectOptions(screen.getByLabelText("Status"), "APPROVED");
      await user.click(screen.getByRole("button", { name: "Salvar" }));

      await screen.findByRole("alert");
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["admin", "comments"],
      });
    });

    it("reabrir após edição com erro começa com formulário limpo", async () => {
      updateCommentMock.mockRejectedValue(createAxiosError(400));
      const { user, trigger } = await openEditDialog();

      const author = screen.getByLabelText("Autor");
      await user.clear(author);
      await user.type(author, "Ana");
      await user.click(screen.getByRole("button", { name: "Salvar" }));
      await screen.findByRole("alert");
      await user.click(screen.getByRole("button", { name: "Cancelar" }));
      await waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
      );

      await user.click(trigger);

      await screen.findByRole("dialog", { name: "Editar comentário" });
      expect(screen.getByLabelText("Autor")).toHaveValue("Cliente");
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });
});
