import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("./admin-mobile-nav", () => ({
  AdminMobileNav: () => <div data-testid="admin-mobile-nav" />,
}));

vi.mock("./admin-account-menu", () => ({
  AdminAccountMenu: () => <div data-testid="admin-account-menu" />,
}));

import { AdminHeader } from "./admin-header";

describe("AdminHeader", () => {
  it("renderiza AdminMobileNav e AdminAccountMenu", () => {
    render(<AdminHeader />);

    expect(screen.getByTestId("admin-mobile-nav")).toBeInTheDocument();
    expect(screen.getByTestId("admin-account-menu")).toBeInTheDocument();
    expect(screen.getByRole("banner")).toBeInTheDocument();
  });
});
