import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { Sheet, SheetContent, SheetDescription, SheetTitle } from "./sheet";

const MOTION_REDUCE = [
  "motion-reduce:data-open:animate-none",
  "motion-reduce:data-closed:animate-none",
];

describe("Sheet (overlay e conteúdo)", () => {
  it("overlay opaco sem glassmorphism e conteúdo com reduced motion", () => {
    render(
      <Sheet open>
        <SheetContent side="left">
          <SheetTitle>Menu</SheetTitle>
          <SheetDescription>Navegação</SheetDescription>
        </SheetContent>
      </Sheet>,
    );

    const overlay = document.querySelector<HTMLElement>('[data-slot="sheet-overlay"]');
    expect(overlay).not.toBeNull();
    expect(overlay).toHaveClass("bg-background/80", ...MOTION_REDUCE);
    expect(overlay?.className).not.toMatch(/backdrop-blur/);
    expect(overlay).not.toHaveClass("bg-black/10");

    const content = screen.getByRole("dialog");
    expect(content).toHaveAttribute("data-slot", "sheet-content");
    expect(content).toHaveAttribute("data-side", "left");
    expect(content).toHaveClass(...MOTION_REDUCE);
    expect(content.className).not.toMatch(/backdrop-blur/);
  });
});
