import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const usePathnameMock = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => usePathnameMock(),
}));

import { AdminNavLink } from "./admin-nav-link";

describe("AdminNavLink", () => {
  it("marca aria-current='page' quando o pathname corresponde ao href", () => {
    usePathnameMock.mockReturnValue("/admin");

    render(<AdminNavLink item={{ href: "/admin", label: "Dashboard", match: "exact" }} />);

    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("não marca aria-current quando o pathname não corresponde", () => {
    usePathnameMock.mockReturnValue("/admin/trabalhos/novo");

    render(<AdminNavLink item={{ href: "/admin", label: "Dashboard", match: "exact" }} />);

    expect(
      screen.getByRole("link", { name: "Dashboard" }),
    ).not.toHaveAttribute("aria-current");
  });

  it.each(["/admin/trabalhos/novo", "/admin/trabalhos/restauracao-fusca/editar"])(
    "marca 'Trabalhos' como ativo na sub-rota %s",
    (pathname) => {
      usePathnameMock.mockReturnValue(pathname);

      render(
        <AdminNavLink
          item={{ href: "/admin/trabalhos", label: "Trabalhos", match: "prefix" }}
        />,
      );

      const link = screen.getByRole("link", { name: "Trabalhos" });
      expect(link).toHaveAttribute("aria-current", "page");
      expect(link).toHaveClass("bg-accent", "text-foreground", "before:bg-primary");
    },
  );

  it("não marca 'Trabalhos' como ativo em /admin/trabalhosX (sem falso positivo)", () => {
    usePathnameMock.mockReturnValue("/admin/trabalhosX");

    render(
      <AdminNavLink
        item={{ href: "/admin/trabalhos", label: "Trabalhos", match: "prefix" }}
      />,
    );

    const link = screen.getByRole("link", { name: "Trabalhos" });
    expect(link).not.toHaveAttribute("aria-current");
    expect(link).toHaveClass("text-muted-foreground");
  });

  it("chama onNavigate ao clicar no link", async () => {
    usePathnameMock.mockReturnValue("/admin");
    const onNavigate = vi.fn();
    const user = userEvent.setup();

    render(
      <AdminNavLink
        item={{ href: "/admin", label: "Dashboard", match: "exact" }}
        onNavigate={onNavigate}
      />,
    );

    await user.click(screen.getByRole("link", { name: "Dashboard" }));

    expect(onNavigate).toHaveBeenCalledTimes(1);
  });
});
