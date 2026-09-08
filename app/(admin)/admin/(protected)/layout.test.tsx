import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

/**
 * Camada 2 de proteção (`ProtectedAdminLayout`): mocka `auth.server`
 * (`getSession`), `next/navigation` (`redirect`) e `AuthProvider`
 * (Client Component real seria testado separadamente em
 * `lib/auth/AuthProvider.test.tsx`) para isolar apenas a lógica de
 * redirect/render deste Server Component.
 */
const getSessionMock = vi.fn();
const redirectMock = vi.fn((path: string) => {
  throw new Error(`NEXT_REDIRECT:${path}`);
});

vi.mock("@/lib/api/auth.server", () => ({
  getSession: () => getSessionMock(),
}));

vi.mock("next/navigation", () => ({
  redirect: (path: string) => redirectMock(path),
}));

vi.mock("@/lib/auth/AuthProvider", () => ({
  AuthProvider: ({
    initialUser,
    children,
  }: {
    initialUser: unknown;
    children: React.ReactNode;
  }) => (
    <div data-testid="auth-provider" data-initial-user={JSON.stringify(initialUser)}>
      {children}
    </div>
  ),
}));

describe("ProtectedAdminLayout", () => {
  it("redireciona para /admin/login quando getSession() retorna null", async () => {
    getSessionMock.mockResolvedValue(null);
    const { default: ProtectedAdminLayout } = await import("./layout");

    await expect(
      ProtectedAdminLayout({ children: <p>conteúdo</p> }),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(redirectMock).toHaveBeenCalledWith("/admin/login");
  });

  it("renderiza AuthProvider com initialUser e os children quando getSession() tem sucesso", async () => {
    const user = { id: "1", email: "admin@carshop.com", name: "Admin" };
    getSessionMock.mockResolvedValue({ user });
    const { default: ProtectedAdminLayout } = await import("./layout");

    render(await ProtectedAdminLayout({ children: <p>painel admin</p> }));

    const provider = screen.getByTestId("auth-provider");
    expect(provider).toHaveAttribute(
      "data-initial-user",
      JSON.stringify(user),
    );
    expect(screen.getByText("painel admin")).toBeInTheDocument();
  });
});
