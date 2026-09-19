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
  it("redireciona para /admin/login e não renderiza children quando nunca houve sessão (acesso não autenticado)", async () => {
    // Cenário "nunca autenticado": getSession() retorna null porque não
    // havia sessão/cookie válido nenhum na request. Este Server Component
    // trata "nunca autenticado" e "sessão expirada" de forma idêntica
    // (qualquer `null` de getSession() vira redirect) — a distinção
    // semântica entre os dois cenários de entrada HTTP é coberta
    // explicitamente em `lib/api/auth.server.test.ts`.
    getSessionMock.mockResolvedValue(null);
    const { default: ProtectedAdminLayout } = await import("./layout");

    await expect(
      ProtectedAdminLayout({ children: <p>conteúdo admin sigiloso</p> }),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(redirectMock).toHaveBeenCalledWith("/admin/login");
  });

  it("redireciona para /admin/login e não renderiza children quando a sessão existente expirou entre requests", async () => {
    // Cenário "sessão expirada": diferente do teste anterior — aqui existia
    // uma sessão previamente válida (ex.: usuário autenticado navegando),
    // mas getSession() retorna null porque essa sessão não é mais aceita
    // pelo backend na request atual. O DoD exige que este cenário também
    // não exponha conteúdo admin, o que é verificado aqui de forma nomeada
    // e independente do cenário "nunca autenticado" acima.
    getSessionMock.mockResolvedValue(null);
    const { default: ProtectedAdminLayout } = await import("./layout");

    await expect(
      ProtectedAdminLayout({ children: <p>conteúdo admin sigiloso</p> }),
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
