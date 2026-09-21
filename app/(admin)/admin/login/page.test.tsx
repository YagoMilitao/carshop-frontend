import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const loginMock = vi.fn();
const pushMock = vi.fn();
const toastSuccessMock = vi.fn();
const useSearchParamsMock = vi.fn(() => new URLSearchParams());

vi.mock("@/lib/auth/AuthProvider", () => ({
  useAuth: () => ({ login: (payload: unknown) => loginMock(payload) }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => useSearchParamsMock(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: (message: string) => toastSuccessMock(message),
  },
}));

import AdminLoginPage from "./page";

type LoginInput = {
  email?: string;
  password?: string;
};

async function submitLogin({ email, password }: LoginInput = {}) {
  const user = userEvent.setup();
  render(<AdminLoginPage />);

  if (email) {
    await user.type(screen.getByLabelText("E-mail"), email);
  }

  if (password) {
    await user.type(screen.getByLabelText("Senha"), password);
  }

  await user.click(screen.getByRole("button", { name: "Entrar" }));
}

describe("AdminLoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSearchParamsMock.mockReturnValue(new URLSearchParams());
  });

  it("renderiza LoginForm dentro de Suspense (smoke test)", async () => {
    await submitLogin();

    expect(screen.getByRole("heading", { name: "Entrar no painel admin" })).toBeInTheDocument();
  });

  it("exibe erros de validação quando o formulário é submetido vazio", async () => {
    await submitLogin();

    expect(
      await screen.findByText("Informe o e-mail."),
    ).toBeInTheDocument();
    expect(screen.getByText("Informe a senha.")).toBeInTheDocument();
    expect(loginMock).not.toHaveBeenCalled();
  });

  it("exibe erro de formato quando o e-mail é inválido", async () => {
    await submitLogin({ email: "nao-e-email", password: "123456" });

    expect(await screen.findByText("E-mail inválido.")).toBeInTheDocument();
    expect(loginMock).not.toHaveBeenCalled();
  });

  it("conclui o login, exibe o toast de sucesso e redireciona para /admin quando não há ?redirect=", async () => {
    loginMock.mockResolvedValue(undefined);
    await submitLogin({
      email: "admin@carshop.com",
      password: "123456",
    });

    await waitFor(() =>
      expect(loginMock).toHaveBeenCalledWith({
        email: "admin@carshop.com",
        password: "123456",
      }),
    );
    expect(toastSuccessMock).toHaveBeenCalledWith("Admin logado");
    expect(pushMock).toHaveBeenCalledWith("/admin");
    expect(toastSuccessMock.mock.invocationCallOrder[0]).toBeLessThan(
      pushMock.mock.invocationCallOrder[0],
    );
  });

  it("conclui o login e redireciona para a rota original quando ?redirect= é uma rota interna válida", async () => {
    loginMock.mockResolvedValue(undefined);
    useSearchParamsMock.mockReturnValue(
      new URLSearchParams({ redirect: "/admin/trabalhos/123" }),
    );

    await submitLogin({
      email: "admin@carshop.com",
      password: "123456",
    });

    await waitFor(() =>
      expect(pushMock).toHaveBeenCalledWith("/admin/trabalhos/123"),
    );
  });

  it.each(["https://evil.com", "//evil.com"])(
    "conclui o login e redireciona para /admin quando ?redirect= é malicioso: %s",
    async (maliciousRedirect) => {
      loginMock.mockResolvedValue(undefined);
      useSearchParamsMock.mockReturnValue(
        new URLSearchParams({ redirect: maliciousRedirect }),
      );

      await submitLogin({
        email: "admin@carshop.com",
        password: "123456",
      });

      await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/admin"));
      expect(pushMock).not.toHaveBeenCalledWith(maliciousRedirect);
    },
  );

  it.each(["E-mail não encontrado.", "Senha incorreta."])(
    "normaliza a mensagem da API sem revelar a causa da falha: %s",
    async (apiMessage) => {
      loginMock.mockRejectedValue({
        response: { data: { message: apiMessage } },
      });
      await submitLogin({
        email: "admin@carshop.com",
        password: "senha-errada",
      });

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "E-mail ou senha inválidos.",
      );
      expect(screen.queryByText(apiMessage)).not.toBeInTheDocument();
      expect(toastSuccessMock).not.toHaveBeenCalled();
      expect(pushMock).not.toHaveBeenCalled();
    },
  );
});
