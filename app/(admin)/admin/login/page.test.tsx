import { AxiosError } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const loginMock = vi.fn();
const pushMock = vi.fn();

vi.mock("@/lib/auth/AuthProvider", () => ({
  useAuth: () => ({ login: (payload: unknown) => loginMock(payload) }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

import AdminLoginPage from "./page";

describe("AdminLoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exibe erros de validação quando o formulário é submetido vazio", async () => {
    const user = userEvent.setup();
    render(<AdminLoginPage />);

    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(
      await screen.findByText("Informe o e-mail."),
    ).toBeInTheDocument();
    expect(screen.getByText("Informe a senha.")).toBeInTheDocument();
    expect(loginMock).not.toHaveBeenCalled();
  });

  it("exibe erro de formato quando o e-mail é inválido", async () => {
    const user = userEvent.setup();
    render(<AdminLoginPage />);

    await user.type(screen.getByLabelText("E-mail"), "nao-e-email");
    await user.type(screen.getByLabelText("Senha"), "123456");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByText("E-mail inválido.")).toBeInTheDocument();
    expect(loginMock).not.toHaveBeenCalled();
  });

  it("submit bem-sucedido chama login() com email/senha e redireciona para /admin", async () => {
    loginMock.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<AdminLoginPage />);

    await user.type(screen.getByLabelText("E-mail"), "admin@carshop.com");
    await user.type(screen.getByLabelText("Senha"), "123456");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() =>
      expect(loginMock).toHaveBeenCalledWith({
        email: "admin@carshop.com",
        password: "123456",
      }),
    );
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/admin"));
  });

  it("submit com erro exibe a mensagem da API sem travar a UI (permanece no formulário)", async () => {
    loginMock.mockRejectedValue(
      new AxiosError("Unauthorized", "ERR_BAD_REQUEST", undefined, undefined, {
        status: 401,
        statusText: "Unauthorized",
        headers: {},
        config: {} as never,
        data: { message: "Credenciais inválidas." },
      }),
    );
    const user = userEvent.setup();
    render(<AdminLoginPage />);

    await user.type(screen.getByLabelText("E-mail"), "admin@carshop.com");
    await user.type(screen.getByLabelText("Senha"), "senha-errada");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(
      await screen.findByRole("alert"),
    ).toHaveTextContent("Credenciais inválidas.");
    expect(pushMock).not.toHaveBeenCalled();
  });
});
