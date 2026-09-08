import { AxiosError } from "axios";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const createCommentMock = vi.fn();

vi.mock("@/lib/api/comments.client", () => ({
  createComment: (workId: string, payload: unknown) =>
    createCommentMock(workId, payload),
}));

import { CommentForm } from "./comment-form";

describe("CommentForm", () => {
  it("exibe erros de validação quando o formulário é submetido vazio", async () => {
    const user = userEvent.setup();
    render(<CommentForm workId="work-1" />);

    await user.click(screen.getByRole("button", { name: "Enviar comentário" }));

    expect(await screen.findByText("Informe seu nome.")).toBeInTheDocument();
    expect(screen.getByText("Escreva um comentário.")).toBeInTheDocument();
    expect(createCommentMock).not.toHaveBeenCalled();
  });

  it("submit bem-sucedido chama createComment(workId, payload) e mostra a mensagem de aguardando aprovação", async () => {
    createCommentMock.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<CommentForm workId="work-1" />);

    await user.type(screen.getByLabelText("Nome"), "Maria");
    await user.type(screen.getByLabelText("Comentário"), "Ótimo trabalho!");
    await user.click(screen.getByRole("button", { name: "Enviar comentário" }));

    expect(
      await screen.findByRole("status"),
    ).toHaveTextContent("Comentário enviado! Ele será exibido após aprovação.");
    expect(createCommentMock).toHaveBeenCalledWith("work-1", {
      authorName: "Maria",
      content: "Ótimo trabalho!",
    });
    expect(
      screen.queryByRole("button", { name: "Enviar comentário" }),
    ).not.toBeInTheDocument();
  });

  it("submit com erro exibe a mensagem da API sem travar a UI (permanece no formulário)", async () => {
    createCommentMock.mockRejectedValue(
      new AxiosError("Bad Request", "ERR_BAD_REQUEST", undefined, undefined, {
        status: 400,
        statusText: "Bad Request",
        headers: {},
        config: {} as never,
        data: { message: "Comentário inválido." },
      }),
    );
    const user = userEvent.setup();
    render(<CommentForm workId="work-1" />);

    await user.type(screen.getByLabelText("Nome"), "Maria");
    await user.type(screen.getByLabelText("Comentário"), "Ótimo trabalho!");
    await user.click(screen.getByRole("button", { name: "Enviar comentário" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Comentário inválido.",
    );
    expect(
      screen.getByRole("button", { name: "Enviar comentário" }),
    ).toBeInTheDocument();
  });

  it("submit com erro sem mensagem estruturada da API exibe a mensagem genérica", async () => {
    createCommentMock.mockRejectedValue(new Error("network down"));
    const user = userEvent.setup();
    render(<CommentForm workId="work-1" />);

    await user.type(screen.getByLabelText("Nome"), "Maria");
    await user.type(screen.getByLabelText("Comentário"), "Ótimo trabalho!");
    await user.click(screen.getByRole("button", { name: "Enviar comentário" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Ocorreu um erro inesperado. Tente novamente.",
    );
  });
});
