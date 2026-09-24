import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  AdminEmptyState,
  AdminErrorState,
  AdminLoadingState,
} from "./admin-states";

describe("AdminLoadingState", () => {
  it("renderiza um <output> sem aria-busy e mantém o label sr-only no DOM", () => {
    render(<AdminLoadingState label="Carregando trabalhos..." />);

    const status = screen.getByRole("status");
    expect(status.tagName).toBe("OUTPUT");
    expect(status).not.toHaveAttribute("aria-busy");
    expect(status).toHaveTextContent("Carregando trabalhos...");
    expect(screen.getByText("Carregando trabalhos...")).toHaveClass("sr-only");
  });

  it("renderiza 3 skeletons aria-hidden por padrão e respeita `rows`", () => {
    const { rerender } = render(<AdminLoadingState label="Carregando..." />);

    const status = screen.getByRole("status");
    const defaultSkeletons = status.querySelectorAll('[aria-hidden="true"]');
    expect(defaultSkeletons).toHaveLength(3);
    defaultSkeletons.forEach((skeleton) => {
      expect(skeleton).toHaveClass("motion-reduce:animate-none");
    });

    rerender(<AdminLoadingState label="Carregando..." rows={5} />);
    expect(
      screen.getByRole("status").querySelectorAll('[aria-hidden="true"]'),
    ).toHaveLength(5);
  });
});

describe("AdminErrorState", () => {
  it("anuncia a mensagem com role=alert e sem botão quando não há onRetry", () => {
    render(<AdminErrorState message="Falha ao carregar." />);

    expect(screen.getByRole("alert")).toHaveTextContent("Falha ao carregar.");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("chama onRetry ao clicar em 'Tentar novamente'", async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();

    render(<AdminErrorState message="Falha." onRetry={onRetry} />);

    const button = screen.getByRole("button", { name: "Tentar novamente" });
    expect(button).toBeEnabled();
    await user.click(button);

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("desabilita o botão e troca o texto enquanto isRetrying", async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();

    render(<AdminErrorState message="Falha." onRetry={onRetry} isRetrying />);

    const button = screen.getByRole("button", { name: "Tentando novamente..." });
    expect(button).toBeDisabled();
    await user.click(button);

    expect(onRetry).not.toHaveBeenCalled();
  });
});

describe("AdminEmptyState", () => {
  it("renderiza apenas o título quando não há descrição/ação", () => {
    const { container } = render(<AdminEmptyState title="Nada por aqui." />);

    expect(screen.getByText("Nada por aqui.")).toBeInTheDocument();
    expect(container.querySelectorAll("p")).toHaveLength(1);
  });

  it("renderiza título, descrição e ação", () => {
    render(
      <AdminEmptyState
        title="Nenhum trabalho cadastrado."
        description="Crie o primeiro trabalho."
        action={<a href="/admin/trabalhos/novo">Novo trabalho</a>}
      />,
    );

    expect(screen.getByText("Nenhum trabalho cadastrado.")).toBeInTheDocument();
    expect(screen.getByText("Crie o primeiro trabalho.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Novo trabalho" })).toHaveAttribute(
      "href",
      "/admin/trabalhos/novo",
    );
  });
});
