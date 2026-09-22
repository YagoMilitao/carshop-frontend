import { AxiosError } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const approveCommentMock = vi.fn();
const updateCommentMock = vi.fn();
const deleteCommentMock = vi.fn();
const revalidateCommentsTagMock = vi.fn();
const invalidateQueriesMock = vi.fn();

vi.mock("@/lib/api/comments.client", () => ({
  adminCommentsQueryKey: (status?: string) => ["admin", "comments", status],
  approveComment: (commentId: string) => approveCommentMock(commentId),
  updateComment: (commentId: string, payload: unknown) =>
    updateCommentMock(commentId, payload),
  deleteComment: (commentId: string) => deleteCommentMock(commentId),
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: invalidateQueriesMock }),
}));

vi.mock("../actions", () => ({
  revalidateCommentsTag: (workId: string) => revalidateCommentsTagMock(workId),
}));

import { CommentModerationForm } from "./comment-moderation-form";

async function fillIds(
  user: ReturnType<typeof userEvent.setup>,
  { commentId = "c-1", workId = "work-1" } = {},
) {
  await user.type(screen.getByLabelText("ID do comentário"), commentId);
  await user.type(
    screen.getByLabelText("ID do work (para invalidar o cache de comentários)"),
    workId,
  );
}

describe("CommentModerationForm (opera por commentId/workId conhecidos — sem endpoint de listagem)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    invalidateQueriesMock.mockResolvedValue(undefined);
  });

  it("exige commentId e workId antes de qualquer ação (não chama a API sem eles)", async () => {
    const user = userEvent.setup();
    render(<CommentModerationForm />);

    await user.click(screen.getByRole("button", { name: "Aprovar" }));

    expect(
      await screen.findByText("Informe o ID do comentário e o ID do work."),
    ).toBeInTheDocument();
    expect(approveCommentMock).not.toHaveBeenCalled();
  });

  it("aprova o comentário com Authorization/X-CSRF-Token anexados pelo interceptor (via approveComment do client Axios) e invalida o cache", async () => {
    approveCommentMock.mockResolvedValue({});
    revalidateCommentsTagMock.mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(<CommentModerationForm />);
    await fillIds(user);

    await user.click(screen.getByRole("button", { name: "Aprovar" }));

    await waitFor(() =>
      expect(approveCommentMock).toHaveBeenCalledWith("c-1"),
    );
    expect(revalidateCommentsTagMock).toHaveBeenCalledWith("work-1");
    expect(invalidateQueriesMock).toHaveBeenCalledWith({
      queryKey: ["admin", "comments", "PENDING"],
    });
  });

  it("edita o conteúdo do comentário via submit do formulário e invalida o cache", async () => {
    updateCommentMock.mockResolvedValue({});
    revalidateCommentsTagMock.mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(<CommentModerationForm />);
    await fillIds(user);
    await user.type(
      screen.getByLabelText("Novo conteúdo (opcional, para editar)"),
      "Conteúdo revisado",
    );

    await user.click(screen.getByRole("button", { name: "Editar" }));

    await waitFor(() =>
      expect(updateCommentMock).toHaveBeenCalledWith("c-1", {
        content: "Conteúdo revisado",
      }),
    );
    expect(revalidateCommentsTagMock).toHaveBeenCalledWith("work-1");
    expect(invalidateQueriesMock).toHaveBeenCalledWith({
      queryKey: ["admin", "comments", "PENDING"],
    });
  });

  it("exclui o comentário e invalida o cache", async () => {
    deleteCommentMock.mockResolvedValue(undefined);
    revalidateCommentsTagMock.mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(<CommentModerationForm />);
    await fillIds(user);

    await user.click(screen.getByRole("button", { name: "Excluir" }));

    await waitFor(() =>
      expect(deleteCommentMock).toHaveBeenCalledWith("c-1"),
    );
    expect(revalidateCommentsTagMock).toHaveBeenCalledWith("work-1");
    expect(invalidateQueriesMock).toHaveBeenCalledWith({
      queryKey: ["admin", "comments", "PENDING"],
    });
  });

  it("exibe a mensagem de erro da API quando a moderação falha, sem invalidar o cache", async () => {
    approveCommentMock.mockRejectedValue(
      new AxiosError("Bad Request", "ERR_BAD_REQUEST", undefined, undefined, {
        status: 404,
        statusText: "Not Found",
        headers: {},
        config: {} as never,
        data: { message: "Comentário não encontrado." },
      }),
    );
    const user = userEvent.setup();

    render(<CommentModerationForm />);
    await fillIds(user, { commentId: "inexistente" });

    await user.click(screen.getByRole("button", { name: "Aprovar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Comentário não encontrado.",
    );
    expect(revalidateCommentsTagMock).not.toHaveBeenCalled();
    expect(invalidateQueriesMock).not.toHaveBeenCalled();
  });
});
