import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import {
  REDIRECT_PATHNAME_HEADER,
  REDIRECT_SEARCH_HEADER,
} from "@/lib/auth/redirect";

/**
 * Camada 2 de proteção (`ProtectedAdminLayout`): mocka `auth.server`
 * (`getSession`), `next/headers` (`headers`), `next/navigation` (`redirect`)
 * e `AuthProvider` (Client Component real seria testado separadamente em
 * `lib/auth/AuthProvider.test.tsx`) para isolar apenas a lógica de
 * redirect/render deste Server Component.
 */
const getSessionMock = vi.fn();
const headersMock = vi.fn();
const redirectMock = vi.fn((path: string) => {
  throw new Error(`NEXT_REDIRECT:${path}`);
});

vi.mock("@/lib/api/auth.server", () => ({
  getSession: () => getSessionMock(),
}));

vi.mock("next/headers", () => ({
  headers: () => headersMock(),
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

// `AdminShell` (sidebar/header/AdminAccountMenu, CARSHOP-152) é testado
// isoladamente em `_components/admin-shell.test.tsx` — aqui mockado para
// isolar apenas a lógica de redirect/render deste Server Component.
vi.mock("./_components/admin-shell", () => ({
  AdminShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="admin-shell">{children}</div>
  ),
}));

function buildHeaders(entries: Record<string, string>): Headers {
  return new Headers(entries);
}

describe("ProtectedAdminLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    headersMock.mockReturnValue(Promise.resolve(buildHeaders({})));
  });

  // Este Server Component trata "nunca autenticado" e "sessão expirada" de
  // forma idêntica (qualquer `null` de getSession() vira redirect) — a
  // distinção semântica entre os dois cenários de entrada HTTP é coberta
  // explicitamente em `lib/api/auth.server.test.ts`. Os 3 casos abaixo
  // verificam apenas que o `?redirect=` é montado corretamente a partir dos
  // headers custom propagados pelo `proxy.ts`, incluindo o fallback quando
  // eles estão ausentes.
  it.each([
    [
      "nunca autenticado, com pathname + search",
      {
        [REDIRECT_PATHNAME_HEADER]: "/admin/trabalhos/123",
        [REDIRECT_SEARCH_HEADER]: "?tab=fotos",
      },
      "/admin/login?redirect=%2Fadmin%2Ftrabalhos%2F123%3Ftab%3Dfotos",
    ],
    [
      "sessão expirada entre requests, só com pathname",
      {
        [REDIRECT_PATHNAME_HEADER]: "/admin/trabalhos/456",
        [REDIRECT_SEARCH_HEADER]: "",
      },
      "/admin/login?redirect=%2Fadmin%2Ftrabalhos%2F456",
    ],
    [
      "headers custom ausentes (fallback para DEFAULT_ADMIN_PATH, sem ?redirect=)",
      {},
      "/admin/login",
    ],
  ])(
    "redireciona para /admin/login e não renderiza children quando getSession() falha (%s)",
    async (_description, headerEntries, expectedLocation) => {
      getSessionMock.mockResolvedValue(null);
      headersMock.mockReturnValue(Promise.resolve(buildHeaders(headerEntries)));
      const { default: ProtectedAdminLayout } = await import("./layout");

      await expect(
        ProtectedAdminLayout({ children: <p>conteúdo admin sigiloso</p> }),
      ).rejects.toThrow("NEXT_REDIRECT");

      expect(redirectMock).toHaveBeenCalledWith(expectedLocation);
    },
  );

  it("renderiza AuthProvider com initialUser e os children quando getSession() tem sucesso, sem chamar redirect", async () => {
    const user = { id: "session-1", email: "admin@carshop.com" };
    getSessionMock.mockResolvedValue({
      user,
      expiresAt: "2026-03-30T12:00:00.000Z",
    });
    const { default: ProtectedAdminLayout } = await import("./layout");

    render(await ProtectedAdminLayout({ children: <p>painel admin</p> }));

    const provider = screen.getByTestId("auth-provider");
    expect(provider).toHaveAttribute(
      "data-initial-user",
      JSON.stringify(user),
    );
    expect(screen.getByText("painel admin")).toBeInTheDocument();
    expect(redirectMock).not.toHaveBeenCalled();
  });
});
