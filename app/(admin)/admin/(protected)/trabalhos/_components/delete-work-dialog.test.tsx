import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DeleteWorkDialog } from "./delete-work-dialog";

describe("DeleteWorkDialog", () => {
  it("não renderiza conteúdo quando open é false", () => {
    render(
      <DeleteWorkDialog
        open={false}
        onOpenChange={vi.fn()}
        workTitle="Restauração Fusca"
        onConfirm={vi.fn()}
        isPending={false}
        error={null}
      />,
    );

    expect(
      screen.queryByRole("heading", { name: "Excluir work" }),
    ).not.toBeInTheDocument();
  });

  it("exibe o título do work e aciona onConfirm ao confirmar", async () => {
    const onConfirm = vi.fn();
    const user = userEvent.setup();

    render(
      <DeleteWorkDialog
        open
        onOpenChange={vi.fn()}
        workTitle="Restauração Fusca"
        onConfirm={onConfirm}
        isPending={false}
        error={null}
      />,
    );

    expect(screen.getByText(/Restauração Fusca/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Excluir" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("chama onOpenChange(false) ao cancelar", async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();

    render(
      <DeleteWorkDialog
        open
        onOpenChange={onOpenChange}
        workTitle="Restauração Fusca"
        onConfirm={vi.fn()}
        isPending={false}
        error={null}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("desabilita os botões e exibe texto de carregamento quando isPending é true", () => {
    render(
      <DeleteWorkDialog
        open
        onOpenChange={vi.fn()}
        workTitle="Restauração Fusca"
        onConfirm={vi.fn()}
        isPending
        error={null}
      />,
    );

    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Excluindo..." }),
    ).toBeDisabled();
  });

  it("exibe mensagem de erro acessível quando error é passado", () => {
    render(
      <DeleteWorkDialog
        open
        onOpenChange={vi.fn()}
        workTitle="Restauração Fusca"
        onConfirm={vi.fn()}
        isPending={false}
        error="Falha ao excluir work."
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Falha ao excluir work.",
    );
  });

  it("repassa onCloseAutoFocus ao AlertDialogContent ao fechar", async () => {
    const onCloseAutoFocus = vi.fn();
    const props = {
      onOpenChange: vi.fn(),
      workTitle: "Restauração Fusca",
      onConfirm: vi.fn(),
      isPending: false,
      error: null,
      onCloseAutoFocus,
    };
    const { rerender } = render(<DeleteWorkDialog open {...props} />);

    rerender(<DeleteWorkDialog open={false} {...props} />);

    await waitFor(() => expect(onCloseAutoFocus).toHaveBeenCalled());
  });
});
