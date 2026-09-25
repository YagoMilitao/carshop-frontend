import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import {
  NativeSelect,
  NativeSelectOptGroup,
  NativeSelectOption,
} from "./native-select";

describe("NativeSelect", () => {
  it("renderiza um <select> nativo com opções, optgroup e ícone decorativo", () => {
    const { container } = render(
      <NativeSelect aria-label="Status" defaultValue="draft" className="w-full">
        <NativeSelectOptGroup label="Estados">
          <NativeSelectOption value="draft">Draft</NativeSelectOption>
          <NativeSelectOption value="published">Published</NativeSelectOption>
        </NativeSelectOptGroup>
      </NativeSelect>,
    );

    const select = screen.getByRole("combobox", { name: "Status" });
    expect(select).toHaveValue("draft");
    expect(select).toHaveAttribute("data-size", "default");
    expect(screen.getByRole("group", { name: "Estados" })).toBeInTheDocument();
    expect(
      container.querySelector('[data-slot="native-select-wrapper"]'),
    ).toHaveClass("w-full");
    expect(
      container.querySelector('[data-slot="native-select-icon"]'),
    ).toHaveAttribute("aria-hidden", "true");
  });

  it("aceita size sm", () => {
    render(
      <NativeSelect aria-label="Tamanho" size="sm">
        <NativeSelectOption value="a">A</NativeSelectOption>
      </NativeSelect>,
    );

    expect(screen.getByRole("combobox", { name: "Tamanho" })).toHaveAttribute(
      "data-size",
      "sm",
    );
  });

  it("usa altura h-9 e text-body-sm por padrão, alinhado ao Input (A-08)", () => {
    render(
      <NativeSelect aria-label="Categoria">
        <NativeSelectOption value="a">A</NativeSelectOption>
      </NativeSelect>,
    );

    const select = screen.getByRole("combobox", { name: "Categoria" });
    const classes = select.className.split(" ");
    expect(classes).toContain("h-9");
    expect(classes).not.toContain("h-8");
    expect(classes).toContain("text-body-sm");
    expect(classes).not.toContain("text-sm");
    expect(classes).toContain("data-[size=sm]:h-7");
  });

  it("usa o anel de foco canônico e aria-invalid não sobrescreve o foco (A-01/A-03)", () => {
    render(
      <NativeSelect aria-label="Status" aria-invalid="true">
        <NativeSelectOption value="a">A</NativeSelectOption>
      </NativeSelect>,
    );

    const select = screen.getByRole("combobox", { name: "Status" });
    expect(select).toHaveClass(
      "outline-hidden",
      "focus-visible:ring-focus-ring",
      "aria-invalid:border-destructive",
    );
    const classes = select.className.split(" ");
    expect(classes).not.toContain("outline-none");
    expect(classes).not.toContain("focus-visible:ring-ring/50");
    for (const token of classes) {
      expect(token).not.toMatch(/^(dark:)?aria-invalid:ring-/);
    }
  });
});
