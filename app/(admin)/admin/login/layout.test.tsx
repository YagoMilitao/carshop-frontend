import { Suspense } from "react";
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
  it("mantém o AuthProvider sob Suspense, com initialUser: null, e renderiza os children", () => {
    const layout = AdminLoginLayout({
      children: <p>formulário de login</p>,
    });

    expect(layout.type).toBe(Suspense);

    render(layout);

    const provider = screen.getByTestId("auth-provider");
    expect(provider).toHaveAttribute("data-initial-user", "null");
    expect(screen.getByText("formulário de login")).toBeInTheDocument();
  });
});
