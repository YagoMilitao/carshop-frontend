import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/lib/auth/AuthProvider", () => ({
  AuthProvider: ({
    initialUser,
    children,
  }: {
    initialUser: unknown;
    children: React.ReactNode;
  }) => (
    <div data-testid="auth-provider" data-initial-user={String(initialUser)}>
      {children}
    </div>
  ),
}));

import AdminLoginLayout from "./layout";

describe("AdminLoginLayout", () => {
  it("monta AuthProvider com initialUser: null e renderiza os children", () => {
    render(
      <AdminLoginLayout>
        <p>formulário de login</p>
      </AdminLoginLayout>,
    );

    const provider = screen.getByTestId("auth-provider");
    expect(provider).toHaveAttribute("data-initial-user", "null");
    expect(screen.getByText("formulário de login")).toBeInTheDocument();
  });
});
