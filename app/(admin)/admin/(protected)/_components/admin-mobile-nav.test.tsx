import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin",
}));

import { AdminMobileNav } from "./admin-mobile-nav";

describe("AdminMobileNav", () => {
  let desktopChangeListener: ((event: MediaQueryListEvent) => void) | undefined;
  const removeEventListenerMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    desktopChangeListener = undefined;
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn(() => ({
        matches: false,
        media: "(min-width: 64rem)",
        onchange: null,
        addEventListener: (
          _type: string,
          listener: (event: MediaQueryListEvent) => void,
        ) => {
          desktopChangeListener = listener;
        },
        removeEventListener: removeEventListenerMock,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it("abre o drawer com os itens de navegação ao clicar no trigger", async () => {
    const user = userEvent.setup();
    render(<AdminMobileNav />);

    expect(
      screen.queryByRole("link", { name: "Dashboard" }),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Abrir menu de navegação" }),
    );

    expect(
      await screen.findByRole("link", { name: "Dashboard" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Novo trabalho" }),
    ).toBeInTheDocument();
  });

  it("fecha o drawer ao navegar por um item de menu", async () => {
    const user = userEvent.setup();
    render(<AdminMobileNav />);

    await user.click(
      screen.getByRole("button", { name: "Abrir menu de navegação" }),
    );

    const dashboardLink = await screen.findByRole("link", {
      name: "Dashboard",
    });
    await user.click(dashboardLink);

    expect(
      screen.queryByRole("link", { name: "Dashboard" }),
    ).not.toBeInTheDocument();
  });

  it("fecha o drawer quando o viewport entra no breakpoint desktop", async () => {
    const user = userEvent.setup();
    render(<AdminMobileNav />);

    await user.click(
      screen.getByRole("button", { name: "Abrir menu de navegação" }),
    );
    expect(
      await screen.findByRole("link", { name: "Dashboard" }),
    ).toBeInTheDocument();

    act(() => {
      desktopChangeListener?.({ matches: false } as MediaQueryListEvent);
    });
    expect(
      screen.getByRole("link", { name: "Dashboard" }),
    ).toBeInTheDocument();

    act(() => {
      desktopChangeListener?.({ matches: true } as MediaQueryListEvent);
    });

    expect(
      screen.queryByRole("link", { name: "Dashboard" }),
    ).not.toBeInTheDocument();
  });

  it("remove o listener de breakpoint ao desmontar", () => {
    const { unmount } = render(<AdminMobileNav />);

    unmount();

    expect(removeEventListenerMock).toHaveBeenCalledWith(
      "change",
      desktopChangeListener,
    );
  });
});
