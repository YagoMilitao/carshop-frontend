import { AxiosError, AxiosHeaders } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const createCommentMock = vi.fn();

vi.mock("@/lib/api/comments.client", () => ({
  createComment: (workId: string, payload: unknown) =>
    createCommentMock(workId, payload),
}));

import { CommentForm } from "./comment-form";

const SUCCESS_MESSAGE =
  "Thanks — your comment was sent and will appear here once it's approved.";
const SUBMIT_ERROR_MESSAGE = "We couldn't send your comment. Please try again.";

/** `fireEvent.change` evita digitar caractere a caractere em valores longos. */
function fillForm(authorName: string, content: string) {
  fireEvent.change(screen.getByLabelText("Name"), {
    target: { value: authorName },
  });
  fireEvent.change(screen.getByLabelText("Comment"), {
    target: { value: content },
  });
}

async function submit() {
  await userEvent.click(screen.getByRole("button", { name: "Send comment" }));
}

describe("CommentForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza labels, botão e alvos em inglês, sem maxLength HTML", () => {
    render(<CommentForm workId="work-1" />);

    const name = screen.getByLabelText("Name");
    const comment = screen.getByLabelText("Comment");
    expect(name).toHaveClass("h-11");
    expect(name).not.toHaveAttribute("maxlength");
    expect(comment).not.toHaveAttribute("maxlength");
    expect(screen.getByRole("button", { name: "Send comment" })).toHaveClass(
      "h-11",
    );
  });

  it("exibe erros de validação acessíveis quando o formulário é submetido vazio", async () => {
    render(<CommentForm workId="work-1" />);

    await submit();

    expect(
      await screen.findByText("Please enter your name (at least 2 characters)."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Please write a comment (at least 3 characters)."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Name")).toHaveAttribute(
      "aria-describedby",
      "comment-author-name-error",
    );
    expect(screen.getByLabelText("Comment")).toHaveAttribute(
      "aria-describedby",
      "comment-content-error",
    );
    expect(createCommentMock).not.toHaveBeenCalled();
  });

  it.each([
    { label: "nome com 1 caractere", name: "M", content: "Great work", error: "Please enter your name (at least 2 characters)." },
    { label: "nome com 81 caracteres", name: "a".repeat(81), content: "Great work", error: "Name must be 80 characters or fewer." },
    { label: "comentário com 2 caracteres", name: "Maria", content: "ok", error: "Please write a comment (at least 3 characters)." },
    { label: "comentário com 1001 caracteres", name: "Maria", content: "a".repeat(1001), error: "Comment must be 1,000 characters or fewer." },
    { label: "whitespace aparado antes do min", name: "Maria", content: "  a ", error: "Please write a comment (at least 3 characters)." },
  ])("rejeita $label", async ({ name, content, error }) => {
    render(<CommentForm workId="work-1" />);

    fillForm(name, content);
    await submit();

    expect(await screen.findByText(error)).toBeInTheDocument();
    expect(createCommentMock).not.toHaveBeenCalled();
  });

  it.each([
    { label: "limites mínimos (2 / 3)", name: "Al", content: "abc" },
    { label: "limites máximos (80 / 1000)", name: "a".repeat(80), content: "b".repeat(1000) },
  ])("aceita $label", async ({ name, content }) => {
    createCommentMock.mockResolvedValue(undefined);
    render(<CommentForm workId="work-1" />);

    fillForm(name, content);
    await submit();

    expect(await screen.findByRole("status")).toHaveTextContent(SUCCESS_MESSAGE);
    expect(createCommentMock).toHaveBeenCalledWith("work-1", {
      authorName: name,
      content,
    });
  });

  it("envia o payload aparado, apenas com authorName e content, e mostra a mensagem de aprovação", async () => {
    createCommentMock.mockResolvedValue(undefined);
    render(<CommentForm workId="work-1" />);

    fillForm("  Maria  ", "  Great work!  ");
    await submit();

    expect(await screen.findByRole("status")).toHaveTextContent(SUCCESS_MESSAGE);
    expect(createCommentMock).toHaveBeenCalledTimes(1);
    const [, payload] = createCommentMock.mock.calls[0] ?? [];
    expect(payload).toStrictEqual({
      authorName: "Maria",
      content: "Great work!",
    });
    expect(
      screen.queryByRole("button", { name: "Send comment" }),
    ).not.toBeInTheDocument();
  });

  it.each([
    {
      label: "erro estruturado da API (pt-BR)",
      error: new AxiosError("Bad Request", "ERR_BAD_REQUEST", undefined, undefined, {
        status: 400,
        statusText: "Bad Request",
        headers: {},
        config: { headers: new AxiosHeaders() },
        data: { message: "Comentário inválido." },
      }),
    },
    { label: "erro de rede", error: new Error("network down") },
  ])("com $label exibe a mensagem local em inglês e mantém o formulário", async ({ error }) => {
    createCommentMock.mockRejectedValue(error);
    render(<CommentForm workId="work-1" />);

    fillForm("Maria", "Great work!");
    await submit();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      SUBMIT_ERROR_MESSAGE,
    );
    expect(screen.queryByText("Comentário inválido.")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Send comment" }),
    ).toBeInTheDocument();
  });

  it.each([
    { scenario: "tag <script>", invalidField: "Comment", invalidValue: "<script>alert(1)</script>" },
    { scenario: "HTML com manipulador de evento", invalidField: "Name", invalidValue: "<img src=x onerror=alert(1)>" },
    { scenario: "HTML embutido no meio de texto legítimo", invalidField: "Comment", invalidValue: "Great <b>work</b> indeed!" },
    { scenario: "comentário HTML", invalidField: "Comment", invalidValue: "<!-- comment -->" },
    { scenario: "declaração doctype", invalidField: "Comment", invalidValue: "<!doctype html>" },
  ])(
    "bloqueia $scenario no campo $invalidField e não chama a API",
    async ({ invalidField, invalidValue }) => {
      render(<CommentForm workId="work-1" />);

      fillForm(
        invalidField === "Name" ? invalidValue : "Maria",
        invalidField === "Comment" ? invalidValue : "Great work!",
      );
      await submit();

      expect(
        await screen.findByText("HTML and scripts are not allowed."),
      ).toBeInTheDocument();
      expect(createCommentMock).not.toHaveBeenCalled();
    },
  );
});
