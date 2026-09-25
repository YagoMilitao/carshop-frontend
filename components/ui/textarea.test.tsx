import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { Textarea } from "./textarea";

const classesOf = (element: HTMLElement): string[] => element.className.split(" ");

describe("Textarea", () => {
  it("usa o anel de foco canônico (ring-focus-ring) e outline-hidden", () => {
    render(<Textarea aria-label="Mensagem" />);

    const textarea = screen.getByRole("textbox", { name: "Mensagem" });
    expect(textarea).toHaveAttribute("data-slot", "textarea");
    expect(textarea).toHaveClass(
      "border-input",
      "outline-hidden",
      "focus-visible:ring-3",
      "focus-visible:ring-focus-ring",
    );

    const classes = classesOf(textarea);
    expect(classes).not.toContain("outline-none");
    expect(classes).not.toContain("focus-visible:ring-ring/50");
  });

  it("em aria-invalid mantém só a borda destrutiva, sem ring que sobrescreva o foco", () => {
    render(<Textarea aria-label="Comentário" aria-invalid="true" className="min-h-32" />);

    const textarea = screen.getByRole("textbox", { name: "Comentário" });
    expect(textarea).toHaveClass("aria-invalid:border-destructive", "min-h-32");
    for (const token of classesOf(textarea)) {
      expect(token).not.toMatch(/^(dark:)?aria-invalid:ring-/);
    }
  });
});
