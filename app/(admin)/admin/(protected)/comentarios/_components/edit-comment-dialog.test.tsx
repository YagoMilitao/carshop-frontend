import { AxiosError, AxiosHeaders } from "axios";
import type { InternalAxiosRequestConfig } from "axios";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Comment } from "@/lib/api/comments";
import type { UpdateCommentPayload } from "@/lib/api/comments.client";

const updateCommentMock =
  vi.fn<(id: string, payload: UpdateCommentPayload) => Promise<Comment>>();
const syncMock = vi.fn<(client: QueryClient, workId: string) => Promise<void>>();
const toastSuccessMock = vi.fn();

vi.mock("@/lib/api/comments.client", () => ({
  updateComment: (id: string, payload: UpdateCommentPayload) =>
    updateCommentMock(id, payload),
}));

vi.mock("./comment-moderation-sync", () => ({
  syncAfterCommentMutation: (client: QueryClient, workId: string) =>
    syncMock(client, workId),
}));

vi.mock("sonner", () => ({
  toast: { success: (message: string) => toastSuccessMock(message) },
}));

import { EditCommentDialog } from "./edit-comment-dialog";

type Props = ComponentProps<typeof EditCommentDialog>;

const comment: Comment = {
  id: "c-1",
  workId: "work-1",
  authorName: "Cliente",
  content: "Ficou incrível!",
  status: "PENDING",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
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

function renderDialog(overrides: Partial<Props> = {}) {
  const props: Props = {
    open: true,
    comment,
    onOpenChange: vi.fn(),
    onSaved: vi.fn(),
    onNotFound: vi.fn(),
    ...overrides,
  };

  render(
    <QueryClientProvider client={queryClient}>
      <EditCommentDialog {...props} />
    </QueryClientProvider>,
  );

  return props;
}

describe("EditCommentDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });
    syncMock.mockResolvedValue(undefined);
  });

  it("não renderiza conteúdo quando open é false", () => {
    renderDialog({ open: false });

    expect(
      screen.queryByRole("heading", { name: "Editar comentário" }),
    ).not.toBeInTheDocument();
  });

  it("preenche os campos com o comentário e não exibe botão X", () => {
    renderDialog();

    expect(
      screen.getByRole("dialog", { name: "Editar comentário" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Autor")).toHaveValue("Cliente");
    expect(screen.getByLabelText("Comentário")).toHaveValue("Ficou incrível!");
    expect(screen.getByLabelText("Status")).toHaveValue("PENDING");
    expect(
      screen.getAllByRole("option").map((option) => option.textContent),
    ).toEqual(["Pendente", "Aprovado"]);
    expect(
      screen.queryByRole("button", { name: /close|fechar/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Salvar" })).toBeEnabled();
  });

  it("não exibe o select de status para comentários HIDDEN", () => {
    renderDialog({ comment: { ...comment, status: "HIDDEN" } });

    expect(screen.queryByLabelText("Status")).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("exibe erros de validação associados aos campos, sem chamar a API", async () => {
    const user = userEvent.setup();
    renderDialog();

    const author = screen.getByLabelText("Autor");
    const content = screen.getByLabelText("Comentário");
    await user.clear(author);
    await user.type(author, "a");
    await user.clear(content);
    await user.type(content, "ab");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(author).toHaveAttribute("aria-invalid", "true");
    expect(author).toHaveAccessibleDescription(
      "O nome do autor deve ter ao menos 2 caracteres.",
    );
    expect(content).toHaveAttribute("aria-invalid", "true");
    expect(content).toHaveAccessibleDescription(
      "O comentário deve ter ao menos 3 caracteres.",
    );
    expect(updateCommentMock).not.toHaveBeenCalled();
  });

  it("valida o limite máximo do autor", async () => {
    const user = userEvent.setup();
    renderDialog();

    const author = screen.getByLabelText("Autor");
    await user.clear(author);
    await user.click(author);
    await user.paste("a".repeat(81));
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(author).toHaveAccessibleDescription(
      "O nome do autor deve ter no máximo 80 caracteres.",
    );
    expect(updateCommentMock).not.toHaveBeenCalled();
  });

  it("sem alterações: mostra aviso e não chama a API", async () => {
    const user = userEvent.setup();
    const props = renderDialog();

    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(
      await screen.findByText("Nenhuma alteração para salvar."),
    ).toBeInTheDocument();
    expect(updateCommentMock).not.toHaveBeenCalled();
    expect(props.onOpenChange).not.toHaveBeenCalled();
  });

  it("envia apenas os campos alterados, sincroniza, exibe toast e fecha", async () => {
    const user = userEvent.setup();
    updateCommentMock.mockResolvedValue({ ...comment, authorName: "Ana" });
    const props = renderDialog();

    const author = screen.getByLabelText("Autor");
    await user.clear(author);
    await user.type(author, "  Ana  ");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() =>
      expect(props.onOpenChange).toHaveBeenCalledWith(false),
    );
    expect(updateCommentMock).toHaveBeenCalledWith("c-1", { authorName: "Ana" });
    expect(syncMock).toHaveBeenCalledWith(queryClient, "work-1");
    expect(toastSuccessMock).toHaveBeenCalledWith("Comentário atualizado.");
    expect(props.onSaved).toHaveBeenCalledTimes(1);
    expect(vi.mocked(props.onSaved).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(props.onOpenChange).mock.invocationCallOrder[0],
    );
  });

  it("envia só status quando apenas o select muda", async () => {
    const user = userEvent.setup();
    updateCommentMock.mockResolvedValue({ ...comment, status: "APPROVED" });
    renderDialog();

    await user.selectOptions(screen.getByLabelText("Status"), "APPROVED");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() =>
      expect(updateCommentMock).toHaveBeenCalledWith("c-1", {
        status: "APPROVED",
      }),
    );
  });

  it("HIDDEN: envia apenas conteúdo, nunca status", async () => {
    const user = userEvent.setup();
    updateCommentMock.mockResolvedValue(comment);
    renderDialog({ comment: { ...comment, status: "HIDDEN" } });

    const content = screen.getByLabelText("Comentário");
    await user.clear(content);
    await user.type(content, "Texto revisado");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() =>
      expect(updateCommentMock).toHaveBeenCalledWith("c-1", {
        content: "Texto revisado",
      }),
    );
  });

  it("exibe 'Salvando...' e bloqueia campos/fechamento durante o pending", async () => {
    const user = userEvent.setup();
    updateCommentMock.mockReturnValue(new Promise(() => undefined));
    const props = renderDialog();

    const author = screen.getByLabelText("Autor");
    await user.clear(author);
    await user.type(author, "Ana");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(
      await screen.findByRole("button", { name: "Salvando..." }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
    expect(author).toBeDisabled();

    await user.keyboard("{Escape}");
    expect(props.onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("400: exibe o erro inline e mantém o Salvar", async () => {
    const user = userEvent.setup();
    updateCommentMock.mockRejectedValue(createAxiosError(400));
    const props = renderDialog();

    await user.selectOptions(screen.getByLabelText("Status"), "APPROVED");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Dados inválidos. Revise os campos e tente novamente.",
    );
    expect(screen.getByRole("button", { name: "Salvar" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeEnabled();
    expect(props.onNotFound).not.toHaveBeenCalled();
    expect(props.onOpenChange).not.toHaveBeenCalled();
    expect(toastSuccessMock).not.toHaveBeenCalled();
    expect(syncMock).not.toHaveBeenCalled();
  });

  it("404: exibe o erro inline, oculta Salvar, troca para 'Fechar' e chama onNotFound", async () => {
    const user = userEvent.setup();
    updateCommentMock.mockRejectedValue(createAxiosError(404));
    const props = renderDialog();

    await user.selectOptions(screen.getByLabelText("Status"), "APPROVED");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Comentário não encontrado. Ele pode ter sido removido; a lista será atualizada.",
    );
    expect(
      screen.queryByRole("button", { name: "Salvar" }),
    ).not.toBeInTheDocument();
    expect(props.onNotFound).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Fechar" }));
    expect(props.onOpenChange).toHaveBeenCalledWith(false);
  });

  it("Cancelar fecha sem chamar a API", async () => {
    const user = userEvent.setup();
    const props = renderDialog();

    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(props.onOpenChange).toHaveBeenCalledWith(false);
    expect(updateCommentMock).not.toHaveBeenCalled();
  });
});
