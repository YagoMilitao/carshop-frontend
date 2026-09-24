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
});
