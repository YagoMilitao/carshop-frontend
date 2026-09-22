import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const logoutMock = vi.fn();
const useAuthMock = vi.fn();
const removeQueriesMock = vi.fn();
const routerReplaceMock = vi.fn();

vi.mock("@/lib/auth/AuthProvider", () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ removeQueries: removeQueriesMock }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: routerReplaceMock }),
}));

import { AdminAccountMenu } from "./admin-account-menu";

describe("AdminAccountMenu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthMock.mockReturnValue({
      user: { id: "session-1", email: "admin@carshop.com" },
      isAuthenticated: true,
      login: vi.fn(),
      logout: logoutMock,
    });
  });

  it("exibe o e-mail do usuário autenticado", () => {
    render(<AdminAccountMenu />);

    expect(screen.getByText("admin@carshop.com")).toBeInTheDocument();
  });

  it("remove o cache admin e redireciona ao login após o logout", async () => {
    logoutMock.mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(<AdminAccountMenu />);

    await user.click(screen.getByRole("button", { name: "Sair" }));

    await waitFor(() => expect(logoutMock).toHaveBeenCalledTimes(1));
    expect(removeQueriesMock).toHaveBeenCalledWith({ queryKey: ["admin"] });
    expect(routerReplaceMock).toHaveBeenCalledWith("/admin/login");
  });

  it("exibe mensagem de erro quando o logout falha", async () => {
    logoutMock.mockRejectedValue(new Error("network down"));
    const user = userEvent.setup();

    render(<AdminAccountMenu />);

    await user.click(screen.getByRole("button", { name: "Sair" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Ocorreu um erro inesperado. Tente novamente.",
    );
    expect(removeQueriesMock).not.toHaveBeenCalled();
    expect(routerReplaceMock).not.toHaveBeenCalled();
  });
});
