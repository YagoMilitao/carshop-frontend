import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "./dialog";

const MOTION_REDUCE = [
  "motion-reduce:data-open:animate-none",
  "motion-reduce:data-closed:animate-none",
];

describe("Dialog (overlay e conteúdo)", () => {
  it("overlay opaco sem glassmorphism e conteúdo com reduced motion", () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>Editar</DialogTitle>
          <DialogDescription>Descrição</DialogDescription>
        </DialogContent>
      </Dialog>,
    );

    const overlay = document.querySelector<HTMLElement>('[data-slot="dialog-overlay"]');
    expect(overlay).not.toBeNull();
    expect(overlay).toHaveClass("bg-background/80", ...MOTION_REDUCE);
    expect(overlay?.className).not.toMatch(/backdrop-blur/);
    expect(overlay).not.toHaveClass("bg-black/10");

    const content = screen.getByRole("dialog");
    expect(content).toHaveAttribute("data-slot", "dialog-content");
    expect(content).toHaveClass(...MOTION_REDUCE);
    expect(content.className).not.toMatch(/backdrop-blur/);
  });
});
