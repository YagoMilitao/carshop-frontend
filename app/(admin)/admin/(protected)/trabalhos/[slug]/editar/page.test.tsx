import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("./edit-work-form", () => ({
  EditWorkForm: ({ slug }: { slug: string }) => (
    <div data-testid="edit-work-form" data-slug={slug} />
  ),
}));

import EditWorkPage, { metadata } from "./page";

describe("EditWorkPage (protegida)", () => {
  it("nunca é indexável (robots noindex, nofollow)", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("renderiza o título e o EditWorkForm com o slug resolvido de params", async () => {
    const ui = await EditWorkPage({
      params: Promise.resolve({ slug: "restauracao-fusca" }),
    });

    render(ui);

    expect(
      screen.getByRole("heading", { name: "Editar trabalho" }),
    ).toBeInTheDocument();
    const form = screen.getByTestId("edit-work-form");
    expect(form).toBeInTheDocument();
    expect(form).toHaveAttribute("data-slug", "restauracao-fusca");
    expect(screen.queryByRole("main")).not.toBeInTheDocument();
  });
});
