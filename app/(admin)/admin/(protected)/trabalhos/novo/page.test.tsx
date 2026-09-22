import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("./create-work-form", () => ({
  CreateWorkForm: () => <div data-testid="create-work-form" />,
}));

import NewWorkPage, { metadata } from "./page";

describe("NewWorkPage (protegida)", () => {
  it("nunca é indexável (robots noindex, nofollow)", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("renderiza o título e o CreateWorkForm", () => {
    render(<NewWorkPage />);

    expect(
      screen.getByRole("heading", { name: "Novo trabalho" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("create-work-form")).toBeInTheDocument();
    expect(screen.queryByRole("main")).not.toBeInTheDocument();
  });
});
