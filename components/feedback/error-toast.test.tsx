import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";

const toastErrorMock = vi.fn();

vi.mock("sonner", () => ({
  toast: {
    error: (message: string) => toastErrorMock(message),
  },
}));

import { ErrorToast } from "./error-toast";

describe("ErrorToast", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("dispara toast.error com a mensagem recebida ao montar", () => {
    render(<ErrorToast message="Falha ao carregar dados." />);

    expect(toastErrorMock).toHaveBeenCalledWith("Falha ao carregar dados.");
    expect(toastErrorMock).toHaveBeenCalledTimes(1);
  });

  it("não renderiza nenhum elemento visível (retorna null)", () => {
    const { container } = render(<ErrorToast message="Erro qualquer." />);

    expect(container).toBeEmptyDOMElement();
  });

  it("dispara novamente o toast quando a mensagem muda", () => {
    const { rerender } = render(<ErrorToast message="Primeira mensagem." />);
    expect(toastErrorMock).toHaveBeenCalledWith("Primeira mensagem.");

    rerender(<ErrorToast message="Segunda mensagem." />);

    expect(toastErrorMock).toHaveBeenCalledWith("Segunda mensagem.");
    expect(toastErrorMock).toHaveBeenCalledTimes(2);
  });
});
