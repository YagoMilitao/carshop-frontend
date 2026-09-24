import { AxiosError, AxiosHeaders } from "axios";
import type { InternalAxiosRequestConfig } from "axios";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Comment } from "@/lib/api/comments";
import type { UpdateCommentPayload } from "@/lib/api/comments.client";

const approveCommentMock = vi.fn<(id: string) => Promise<Comment>>();
const updateCommentMock =
  vi.fn<(id: string, payload: UpdateCommentPayload) => Promise<Comment>>();
const syncMock = vi.fn<(client: QueryClient, workId: string) => Promise<void>>();
const toastSuccessMock = vi.fn();
const toastErrorMock = vi.fn();

vi.mock("@/lib/api/comments.client", () => ({
  adminCommentsBaseQueryKey: ["admin", "comments"],
  approveComment: (id: string) => approveCommentMock(id),
  updateComment: (id: string, payload: UpdateCommentPayload) =>
    updateCommentMock(id, payload),
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

import { CommentListItem } from "./comment-list-item";

const baseComment: Comment = {
  id: "c-1",
  workId: "work-1",
  authorName: "Cliente",
  content: "Ficou incrível!\nRecomendo.",
  status: "PENDING",
  createdAt: "2024-01-02T15:30:00.000Z",
  updatedAt: "2024-01-02T15:30:00.000Z",
};

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

function wrap(children: ReactNode) {
  return (
    <QueryClientProvider client={queryClient}>
      <ul>{children}</ul>
    </QueryClientProvider>
  );
}

function renderItem(
  comment: Comment = baseComment,
  extra: { workTitle?: string } = {},
) {
  const onRequestEdit = vi.fn();
  const onRequestDelete = vi.fn();

  render(
    wrap(
      <CommentListItem
        comment={comment}
        workTitle={extra.workTitle}
        onRequestEdit={onRequestEdit}
        onRequestDelete={onRequestDelete}
      />,
    ),
  );

  return { onRequestEdit, onRequestDelete };
}

describe("CommentListItem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    syncMock.mockResolvedValue(undefined);
  });

  it("exibe autor, badge de status, data formatada, título do work e conteúdo", () => {
    renderItem(baseComment, { workTitle: "Restauração Fusca" });

    const item = screen.getByRole("listitem");
    expect(within(item).getByText("Cliente")).toBeInTheDocument();
    expect(within(item).getByText("Pendente")).toHaveAttribute(
      "data-variant",
      "outline",
    );
    const time = item.querySelector("time");
    expect(time).toHaveAttribute("dateTime", baseComment.createdAt);
    expect(time?.textContent).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    expect(
      within(item).getByText("Trabalho:", { exact: false }),
    ).toHaveTextContent("Trabalho: Restauração Fusca");
    expect(item.querySelector("code")).toBeNull();
    expect(
      within(item).getByText(/Ficou incrível!\s+Recomendo\./),
    ).toBeInTheDocument();
  });

  it("usa o workId como fallback quando não há título", () => {
    renderItem();

    const code = screen.getByText("work-1");
    expect(code.tagName).toBe("CODE");
  });

  it("PENDING: mostra Aprovar e não Voltar para pendente", () => {
    renderItem();

    expect(
      screen.getByRole("button", { name: /^Aprovar comentário de Cliente$/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Voltar para pendente/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^Editar comentário de Cliente$/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^Excluir comentário de Cliente$/ }),
    ).toBeInTheDocument();
  });

  it("APPROVED: mostra Voltar para pendente e não Aprovar", () => {
    renderItem({ ...baseComment, status: "APPROVED" });

    expect(screen.getByText("Aprovado")).toHaveAttribute(
      "data-variant",
      "success",
    );
    expect(
      screen.getByRole("button", { name: /^Voltar para pendente comentário de Cliente$/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^Aprovar/ }),
    ).not.toBeInTheDocument();
  });

  it("HIDDEN: não mostra Aprovar nem Voltar para pendente (nem Ocultar)", () => {
    renderItem({ ...baseComment, status: "HIDDEN" });

    expect(screen.getByText("Oculto")).toHaveAttribute(
      "data-variant",
      "secondary",
    );
    expect(
      screen.queryByRole("button", { name: /^Aprovar/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Voltar para pendente/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Ocultar/ }),
    ).not.toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(2);
  });

  it("Aprovar chama approveComment, sincroniza e exibe toast de sucesso", async () => {
    const user = userEvent.setup();
    approveCommentMock.mockResolvedValue({ ...baseComment, status: "APPROVED" });
    renderItem();

    await user.click(screen.getByRole("button", { name: /^Aprovar/ }));

    await waitFor(() =>
      expect(toastSuccessMock).toHaveBeenCalledWith("Comentário aprovado."),
    );
    expect(approveCommentMock).toHaveBeenCalledWith("c-1");
    expect(updateCommentMock).not.toHaveBeenCalled();
    expect(syncMock).toHaveBeenCalledWith(queryClient, "work-1");
    expect(syncMock.mock.invocationCallOrder[0]).toBeLessThan(
      toastSuccessMock.mock.invocationCallOrder[0],
    );
  });

  it("Voltar para pendente envia PATCH com { status: 'PENDING' }", async () => {
    const user = userEvent.setup();
    updateCommentMock.mockResolvedValue(baseComment);
    renderItem({ ...baseComment, status: "APPROVED" });

    await user.click(
      screen.getByRole("button", { name: /Voltar para pendente/ }),
    );

    await waitFor(() =>
      expect(toastSuccessMock).toHaveBeenCalledWith(
        "Comentário voltou para pendente.",
      ),
    );
    expect(updateCommentMock).toHaveBeenCalledWith("c-1", {
      status: "PENDING",
    });
    expect(approveCommentMock).not.toHaveBeenCalled();
    expect(syncMock).toHaveBeenCalledWith(queryClient, "work-1");
  });

  it("exibe 'Aprovando...' e desabilita todas as ações durante o pending", async () => {
    const user = userEvent.setup();
    approveCommentMock.mockReturnValue(new Promise(() => undefined));
    renderItem();

    await user.click(screen.getByRole("button", { name: /^Aprovar/ }));

    expect(
      await screen.findByRole("button", { name: /^Aprovando\.\.\./ }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: /^Editar/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /^Excluir/ })).toBeDisabled();
  });

  it("exibe 'Atualizando...' ao voltar para pendente", async () => {
    const user = userEvent.setup();
    updateCommentMock.mockReturnValue(new Promise(() => undefined));
    renderItem({ ...baseComment, status: "APPROVED" });

    await user.click(
      screen.getByRole("button", { name: /Voltar para pendente/ }),
    );

    expect(
      await screen.findByRole("button", { name: /^Atualizando\.\.\./ }),
    ).toBeDisabled();
  });

  it("pending é isolado por item", async () => {
    const user = userEvent.setup();
    approveCommentMock.mockReturnValue(new Promise(() => undefined));
    const other: Comment = { ...baseComment, id: "c-2", authorName: "Outro" };

    render(
      wrap(
        <>
          <CommentListItem
            comment={baseComment}
            onRequestEdit={vi.fn()}
            onRequestDelete={vi.fn()}
          />
          <CommentListItem
            comment={other}
            onRequestEdit={vi.fn()}
            onRequestDelete={vi.fn()}
          />
        </>,
      ),
    );

    await user.click(
      screen.getByRole("button", { name: /^Aprovar comentário de Cliente$/ }),
    );

    expect(
      await screen.findByRole("button", { name: /^Aprovando\.\.\. comentário de Cliente$/ }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: /^Aprovar comentário de Outro$/ }),
    ).toBeEnabled();
    expect(
      screen.getByRole("button", { name: /^Editar comentário de Outro$/ }),
    ).toBeEnabled();
  });

  it.each([
    [401, "Sua sessão expirou. Faça login novamente.", false],
    [
      404,
      "Comentário não encontrado. Ele pode ter sido removido; a lista será atualizada.",
      true,
    ],
    [
      429,
      "Muitas tentativas. Aguarde alguns instantes e tente novamente.",
      false,
    ],
  ])(
    "erro %i exibe toast.error e só invalida a lista em 404",
    async (status, message, shouldInvalidate) => {
      const user = userEvent.setup();
      const invalidateSpy = vi
        .spyOn(queryClient, "invalidateQueries")
        .mockResolvedValue(undefined);
      approveCommentMock.mockRejectedValue(createAxiosError(status));
      renderItem();

      await user.click(screen.getByRole("button", { name: /^Aprovar/ }));

      await waitFor(() => expect(toastErrorMock).toHaveBeenCalledWith(message));
      expect(toastSuccessMock).not.toHaveBeenCalled();
      expect(syncMock).not.toHaveBeenCalled();
      if (shouldInvalidate) {
        expect(invalidateSpy).toHaveBeenCalledWith({
          queryKey: ["admin", "comments"],
        });
      } else {
        expect(invalidateSpy).not.toHaveBeenCalled();
      }
      expect(screen.getByRole("button", { name: /^Aprovar/ })).toBeEnabled();
    },
  );

  it("Editar e Excluir delegam ao painel com o comentário e o botão de origem", async () => {
    const user = userEvent.setup();
    const { onRequestEdit, onRequestDelete } = renderItem();

    const editButton = screen.getByRole("button", { name: /^Editar/ });
    const deleteButton = screen.getByRole("button", { name: /^Excluir/ });

    await user.click(editButton);
    await user.click(deleteButton);

    expect(onRequestEdit).toHaveBeenCalledWith(baseComment, editButton);
    expect(onRequestDelete).toHaveBeenCalledWith(baseComment, deleteButton);
    expect(approveCommentMock).not.toHaveBeenCalled();
  });
});
