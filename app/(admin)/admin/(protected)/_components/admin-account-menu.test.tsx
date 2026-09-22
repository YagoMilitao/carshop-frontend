import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const logoutMock = vi.fn();
const useAuthMock = vi.fn();

vi.mock("@/lib/auth/AuthProvider", () => ({
  useAuth: () => useAuthMock(),
}));

import { AdminAccountMenu } from "./admin-account-menu";

describe("AdminAccountMenu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthMock.mockReturnValue({
      user: { id: "1", email: "admin@carshop.com", name: "Admin" },
      isAuthenticated: true,
      login: vi.fn(),
      logout: logoutMock,
    });
  });

  it("exibe o e-mail do usuário autenticado", () => {
    render(<AdminAccountMenu />);

    expect(screen.getByText("admin@carshop.com")).toBeInTheDocument();
  });

  it("chama useAuth().logout() ao clicar em Sair", async () => {
    logoutMock.mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(<AdminAccountMenu />);

    await user.click(screen.getByRole("button", { name: "Sair" }));

    await waitFor(() => expect(logoutMock).toHaveBeenCalledTimes(1));
  });

  it("exibe mensagem de erro quando o logout falha", async () => {
    logoutMock.mockRejectedValue(new Error("network down"));
    const user = userEvent.setup();

    render(<AdminAccountMenu />);

    await user.click(screen.getByRole("button", { name: "Sair" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Ocorreu um erro inesperado. Tente novamente.",
    );
  });
});
