import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";

import { DeleteCommentDialog, getCommentExcerpt } from "./delete-comment-dialog";

type Props = ComponentProps<typeof DeleteCommentDialog>;

function renderDialog(overrides: Partial<Props> = {}) {
  const props: Props = {
    open: true,
    onOpenChange: vi.fn(),
    authorName: "Cliente",
    excerpt: "Ficou incrível!",
    onConfirm: vi.fn(),
    isPending: false,
    canConfirm: true,
    error: null,
    ...overrides,
  };

  const result = render(<DeleteCommentDialog {...props} />);

  return { props, ...result };
}

describe("getCommentExcerpt", () => {
  it("mantém conteúdo com até 80 caracteres", () => {
    expect(getCommentExcerpt("curto")).toBe("curto");
    expect(getCommentExcerpt("a".repeat(80))).toBe("a".repeat(80));
  });

  it("trunca acima de 80 caracteres com reticências", () => {
    expect(getCommentExcerpt("a".repeat(81))).toBe(`${"a".repeat(80)}…`);
  });
});

describe("DeleteCommentDialog", () => {
  it("não renderiza conteúdo quando open é false", () => {
    renderDialog({ open: false });

    expect(
      screen.queryByRole("heading", { name: "Excluir comentário" }),
    ).not.toBeInTheDocument();
  });

  it("exibe título, descrição com autor e trecho, e botões", () => {
    renderDialog();

    expect(
      screen.getByRole("heading", { name: "Excluir comentário" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("alertdialog")).toHaveAccessibleDescription(
      "Tem certeza que deseja excluir o comentário de Cliente (“Ficou incrível!”)? Essa ação não pode ser desfeita.",
    );
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "Excluir comentário" }),
    ).toBeEnabled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("omite o trecho entre aspas quando excerpt é vazio", () => {
    renderDialog({ excerpt: "" });

    expect(screen.getByRole("alertdialog")).toHaveAccessibleDescription(
      "Tem certeza que deseja excluir o comentário de Cliente? Essa ação não pode ser desfeita.",
    );
  });

  it("aciona onConfirm sem fechar o diálogo", async () => {
    const user = userEvent.setup();
    const { props } = renderDialog();

    await user.click(
      screen.getByRole("button", { name: "Excluir comentário" }),
    );

    expect(props.onConfirm).toHaveBeenCalledTimes(1);
    expect(props.onOpenChange).not.toHaveBeenCalled();
  });

  it("cancelar chama onOpenChange(false) sem onConfirm", async () => {
    const user = userEvent.setup();
    const { props } = renderDialog();

    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(props.onOpenChange).toHaveBeenCalledWith(false);
    expect(props.onConfirm).not.toHaveBeenCalled();
  });

  it("exibe 'Excluindo...' e desabilita os botões durante o pending", () => {
    renderDialog({ isPending: true });

    expect(screen.getByRole("button", { name: "Excluindo..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
  });

  it("exibe o erro com role='alert'", () => {
    renderDialog({ error: "Muitas tentativas." });

    expect(screen.getByRole("alert")).toHaveTextContent("Muitas tentativas.");
  });

  it("com canConfirm=false omite a confirmação e oferece só 'Fechar'", () => {
    renderDialog({ canConfirm: false, error: "Comentário não encontrado." });

    expect(
      screen.queryByRole("button", { name: "Excluir comentário" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Fechar" })).toBeEnabled();
    expect(
      screen.queryByRole("button", { name: "Cancelar" }),
    ).not.toBeInTheDocument();
  });

  it("repassa onCloseAutoFocus ao fechar", async () => {
    const onCloseAutoFocus = vi.fn();
    const { props, rerender } = renderDialog({ onCloseAutoFocus });

    rerender(<DeleteCommentDialog {...props} open={false} />);

    await vi.waitFor(() => expect(onCloseAutoFocus).toHaveBeenCalled());
  });
});
