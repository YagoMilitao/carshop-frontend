import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { Input } from "./input";

const classesOf = (element: HTMLElement): string[] => element.className.split(" ");

describe("Input", () => {
  it("usa o anel de foco canônico (ring-focus-ring) e outline-hidden", () => {
    render(<Input aria-label="Nome" />);

    const input = screen.getByRole("textbox", { name: "Nome" });
    expect(input).toHaveAttribute("data-slot", "input");
    expect(input).toHaveClass(
      "h-9",
      "border-input",
      "outline-hidden",
      "focus-visible:ring-3",
      "focus-visible:ring-focus-ring",
    );

    const classes = classesOf(input);
    expect(classes).not.toContain("outline-none");
    expect(classes).not.toContain("focus-visible:ring-ring/50");
  });

  it("em aria-invalid mantém só a borda destrutiva, sem ring que sobrescreva o foco", () => {
    render(<Input aria-label="E-mail" aria-invalid="true" />);

    const input = screen.getByRole("textbox", { name: "E-mail" });
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveClass("aria-invalid:border-destructive");
    for (const token of classesOf(input)) {
      expect(token).not.toMatch(/^(dark:)?aria-invalid:ring-/);
    }
  });

  it("mescla className extra e repassa props", () => {
    render(<Input aria-label="Busca" type="search" className="w-40" disabled />);

    const input = screen.getByRole("searchbox", { name: "Busca" });
    expect(input).toHaveAttribute("type", "search");
    expect(input).toHaveClass("w-40");
    expect(input).toBeDisabled();
  });
});
