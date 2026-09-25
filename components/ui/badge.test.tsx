import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { Badge, badgeVariants } from "./badge";

describe("Badge", () => {
  it("aplica a variante aditiva warning", () => {
    render(<Badge variant="warning">Pendente</Badge>);

    const badge = screen.getByText("Pendente");
    expect(badge).toHaveAttribute("data-variant", "warning");
    expect(badge).toHaveClass("bg-warning/15", "text-warning-text");
  });

  it("mantém as variantes existentes inalteradas", () => {
    expect(badgeVariants({ variant: "success" })).toContain(
      "bg-success/15 text-success-text",
    );
    expect(badgeVariants({ variant: "secondary" })).toContain(
      "bg-secondary text-secondary-foreground",
    );
    expect(badgeVariants({ variant: "default" })).toContain(
      "bg-primary text-primary-foreground",
    );
    expect(badgeVariants({ variant: "outline" })).toContain(
      "border-border text-foreground",
    );
    expect(badgeVariants({ variant: "destructive" })).toContain(
      "bg-destructive/10 text-destructive-text",
    );
    expect(badgeVariants({ variant: "success" })).not.toContain("warning");
  });

  it("usa a variante default quando nenhuma é informada", () => {
    render(<Badge>Novo</Badge>);

    expect(screen.getByText("Novo")).toHaveAttribute("data-variant", "default");
  });

  it("renderiza via asChild no elemento filho", () => {
    render(
      <Badge asChild variant="warning">
        <a href="/admin/comentarios">Pendentes</a>
      </Badge>,
    );

    const link = screen.getByRole("link", { name: "Pendentes" });
    expect(link).toHaveAttribute("data-slot", "badge");
    expect(link).toHaveClass("text-warning-text");
  });

  it("usa o anel de foco canônico sem override na variante destructive (A-01)", () => {
    for (const variant of ["default", "destructive", "warning"] as const) {
      const classes = badgeVariants({ variant }).split(" ");
      expect(classes).toContain("focus-visible:ring-focus-ring");
      expect(classes).not.toContain("focus-visible:ring-ring/50");
      for (const token of classes) {
        expect(token).not.toMatch(/^(dark:)?focus-visible:ring-destructive/);
      }
    }
  });
});
