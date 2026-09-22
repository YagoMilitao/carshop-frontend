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

    render(<AdminNavLink item={{ href: "/admin", label: "Dashboard" }} />);

    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("não marca aria-current quando o pathname não corresponde", () => {
    usePathnameMock.mockReturnValue("/admin/trabalhos/novo");

    render(<AdminNavLink item={{ href: "/admin", label: "Dashboard" }} />);

    expect(
      screen.getByRole("link", { name: "Dashboard" }),
    ).not.toHaveAttribute("aria-current");
  });

  it("chama onNavigate ao clicar no link", async () => {
    usePathnameMock.mockReturnValue("/admin");
    const onNavigate = vi.fn();
    const user = userEvent.setup();

    render(
      <AdminNavLink
        item={{ href: "/admin", label: "Dashboard" }}
        onNavigate={onNavigate}
      />,
    );

    await user.click(screen.getByRole("link", { name: "Dashboard" }));

    expect(onNavigate).toHaveBeenCalledTimes(1);
  });
});
