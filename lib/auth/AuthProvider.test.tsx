import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

/**
 * `AuthProvider` depende de `auth.client.ts` (Axios) e `http.ts`
 * (`setAccessToken`/`onAuthFailure`) — ambos mockados para isolar o
 * comportamento do contexto React, sem chamada de rede real.
 * `next/navigation` (`useRouter`) também é mockado, mesmo padrão usado em
 * `app/(public)/portfolio/[slug]/page.test.tsx` para `notFound`.
 */
const getSessionMock = vi.fn();
const loginRequestMock = vi.fn();
const logoutRequestMock = vi.fn();
const setAccessTokenMock = vi.fn();
let registeredAuthFailureCallback: (() => void) | null = null;
const pushMock = vi.fn();

vi.mock("@/lib/api/auth.client", () => ({
  getSession: () => getSessionMock(),
  login: (payload: unknown) => loginRequestMock(payload),
  logout: () => logoutRequestMock(),
}));

vi.mock("@/lib/api/http", () => ({
  setAccessToken: (token: string | null) => setAccessTokenMock(token),
  onAuthFailure: (callback: () => void) => {
    registeredAuthFailureCallback = callback;
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

import { AuthProvider, useAuth } from "./AuthProvider";

const user = { id: "1", email: "admin@carshop.com", name: "Admin" };

function Consumer() {
  const { user: currentUser, isAuthenticated, login, logout } = useAuth();

  return (
    <div>
      <p data-testid="is-authenticated">{String(isAuthenticated)}</p>
      <p data-testid="user-name">{currentUser?.name ?? "sem-usuario"}</p>
      <button
        onClick={() =>
          void login({ email: "admin@carshop.com", password: "123456" })
        }
      >
        login
      </button>
      <button onClick={() => void logout().catch(() => undefined)}>
        logout
      </button>
    </div>
  );
}

describe("AuthProvider / useAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    registeredAuthFailureCallback = null;
    getSessionMock.mockResolvedValue({ user });
  });

  it("estado inicial reflete initialUser (isAuthenticated true quando há usuário)", async () => {
    render(
      <AuthProvider initialUser={user}>
        <Consumer />
      </AuthProvider>,
    );

    expect(screen.getByTestId("is-authenticated")).toHaveTextContent("true");
    expect(screen.getByTestId("user-name")).toHaveTextContent("Admin");

    await waitFor(() => expect(getSessionMock).toHaveBeenCalled());
  });

  it("estado inicial isAuthenticated false quando initialUser é null", () => {
    getSessionMock.mockReturnValue(new Promise(() => undefined));

    render(
      <AuthProvider initialUser={null}>
        <Consumer />
      </AuthProvider>,
    );

    expect(screen.getByTestId("is-authenticated")).toHaveTextContent("false");
    expect(screen.getByTestId("user-name")).toHaveTextContent("sem-usuario");
  });

  it("login() chama auth.client#login, grava o token via setAccessToken e atualiza isAuthenticated", async () => {
    const authSession = { accessToken: "novo-token", user };
    loginRequestMock.mockResolvedValue(authSession);
    getSessionMock.mockReturnValue(new Promise(() => undefined));
    const userEventInstance = userEvent.setup();

    render(
      <AuthProvider initialUser={null}>
        <Consumer />
      </AuthProvider>,
    );

    await userEventInstance.click(screen.getByText("login"));

    await waitFor(() =>
      expect(screen.getByTestId("is-authenticated")).toHaveTextContent(
        "true",
      ),
    );
    expect(loginRequestMock).toHaveBeenCalledWith({
      email: "admin@carshop.com",
      password: "123456",
    });
    expect(setAccessTokenMock).toHaveBeenCalledWith("novo-token");
    expect(screen.getByTestId("user-name")).toHaveTextContent("Admin");
  });

  it("logout() chama auth.client#logout, limpa o token via setAccessToken(null) e zera isAuthenticated", async () => {
    logoutRequestMock.mockResolvedValue(undefined);
    const userEventInstance = userEvent.setup();

    render(
      <AuthProvider initialUser={user}>
        <Consumer />
      </AuthProvider>,
    );

    await userEventInstance.click(screen.getByText("logout"));

    await waitFor(() =>
      expect(screen.getByTestId("is-authenticated")).toHaveTextContent(
        "false",
      ),
    );
    expect(logoutRequestMock).toHaveBeenCalled();
    expect(setAccessTokenMock).toHaveBeenCalledWith(null);
  });

  it("logout() ainda limpa o estado local mesmo se auth.client#logout rejeitar", async () => {
    logoutRequestMock.mockRejectedValue(new Error("network error"));
    const userEventInstance = userEvent.setup();

    render(
      <AuthProvider initialUser={user}>
        <Consumer />
      </AuthProvider>,
    );

    await userEventInstance.click(screen.getByText("logout"));

    await waitFor(() =>
      expect(screen.getByTestId("is-authenticated")).toHaveTextContent(
        "false",
      ),
    );
    expect(setAccessTokenMock).toHaveBeenCalledWith(null);
  });

  it("registra callback em onAuthFailure que limpa o estado e redireciona para /admin/login", async () => {
    getSessionMock.mockReturnValue(new Promise(() => undefined));

    render(
      <AuthProvider initialUser={user}>
        <Consumer />
      </AuthProvider>,
    );

    expect(registeredAuthFailureCallback).not.toBeNull();

    registeredAuthFailureCallback?.();

    await waitFor(() =>
      expect(screen.getByTestId("is-authenticated")).toHaveTextContent(
        "false",
      ),
    );
    expect(setAccessTokenMock).toHaveBeenCalledWith(null);
    expect(pushMock).toHaveBeenCalledWith("/admin/login");
  });

  it("re-bootstrap ao montar: sincroniza user a partir de getSession() no cliente", async () => {
    const refreshedUser = { id: "2", email: "outro@carshop.com", name: "Outro" };
    getSessionMock.mockResolvedValue({ user: refreshedUser });

    render(
      <AuthProvider initialUser={user}>
        <Consumer />
      </AuthProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("user-name")).toHaveTextContent("Outro"),
    );
  });

  it("falha no re-bootstrap não desloga o usuário (mantém initialUser)", async () => {
    getSessionMock.mockRejectedValue(new Error("network error"));

    render(
      <AuthProvider initialUser={user}>
        <Consumer />
      </AuthProvider>,
    );

    await waitFor(() => expect(getSessionMock).toHaveBeenCalled());
    expect(screen.getByTestId("is-authenticated")).toHaveTextContent("true");
    expect(screen.getByTestId("user-name")).toHaveTextContent("Admin");
  });

  it("useAuth() fora de um AuthProvider lança erro", () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    expect(() => render(<Consumer />)).toThrow(
      "useAuth deve ser usado dentro de <AuthProvider>",
    );

    consoleErrorSpy.mockRestore();
  });
});
