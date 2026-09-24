import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";

import { DeleteWorkImageDialog } from "./delete-work-image-dialog";

type Props = ComponentProps<typeof DeleteWorkImageDialog>;

function renderDialog(overrides: Partial<Props> = {}) {
  const props: Props = {
    open: true,
    onOpenChange: vi.fn(),
    imageLabel: "Banco restaurado",
    onConfirm: vi.fn(),
    isPending: false,
    canConfirm: true,
    error: null,
    ...overrides,
  };

  render(<DeleteWorkImageDialog {...props} />);

  return props;
}

describe("DeleteWorkImageDialog", () => {
  it("não renderiza conteúdo quando open é false", () => {
    renderDialog({ open: false });

    expect(
      screen.queryByRole("heading", { name: "Remover imagem" }),
    ).not.toBeInTheDocument();
  });

  it("exibe título, descrição com o label da imagem e botões", () => {
    renderDialog();

    expect(
      screen.getByRole("heading", { name: "Remover imagem" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Tem certeza que deseja remover “Banco restaurado”? Essa ação não pode ser desfeita.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "Excluir imagem" }),
    ).toBeEnabled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("aciona onConfirm sem fechar o diálogo ao confirmar", async () => {
    const user = userEvent.setup();
    const { onConfirm, onOpenChange } = renderDialog();

    await user.click(screen.getByRole("button", { name: "Excluir imagem" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("chama onOpenChange(false) ao cancelar sem chamar onConfirm", async () => {
    const user = userEvent.setup();
    const { onConfirm, onOpenChange } = renderDialog();

    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("exibe 'Excluindo...' e desabilita os botões durante o pending", () => {
    renderDialog({ isPending: true });

    expect(screen.getByRole("button", { name: "Excluindo..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
    expect(
      screen.queryByRole("button", { name: "Excluir imagem" }),
    ).not.toBeInTheDocument();
  });

  it("exibe o erro com role='alert'", () => {
    renderDialog({ error: "Muitas tentativas." });

    expect(screen.getByRole("alert")).toHaveTextContent("Muitas tentativas.");
  });

  it("omite a ação de confirmar e oferece só 'Fechar' quando canConfirm é false", () => {
    renderDialog({
      canConfirm: false,
      error: "Imagem ou trabalho não encontrado. A lista foi atualizada.",
    });

    expect(
      screen.queryByRole("button", { name: "Excluir imagem" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Fechar" })).toBeEnabled();
    expect(
      screen.queryByRole("button", { name: "Cancelar" }),
    ).not.toBeInTheDocument();
  });

  it("repassa onCloseAutoFocus ao fechar", async () => {
    const onCloseAutoFocus = vi.fn();
    const { rerender } = render(
      <DeleteWorkImageDialog
        open
        onOpenChange={vi.fn()}
        imageLabel="Banco restaurado"
        onConfirm={vi.fn()}
        isPending={false}
        canConfirm
        error={null}
        onCloseAutoFocus={onCloseAutoFocus}
      />,
    );

    rerender(
      <DeleteWorkImageDialog
        open={false}
        onOpenChange={vi.fn()}
        imageLabel="Banco restaurado"
        onConfirm={vi.fn()}
        isPending={false}
        canConfirm
        error={null}
        onCloseAutoFocus={onCloseAutoFocus}
      />,
    );

    await vi.waitFor(() => expect(onCloseAutoFocus).toHaveBeenCalled());
  });
});
