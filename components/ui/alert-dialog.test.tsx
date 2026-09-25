import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "./alert-dialog";

const MOTION_REDUCE = [
  "motion-reduce:data-open:animate-none",
  "motion-reduce:data-closed:animate-none",
];

describe("AlertDialog (overlay e conteúdo)", () => {
  it("overlay opaco sem glassmorphism e conteúdo com reduced motion", () => {
    render(
      <AlertDialog open>
        <AlertDialogContent>
          <AlertDialogTitle>Excluir?</AlertDialogTitle>
          <AlertDialogDescription>Ação irreversível.</AlertDialogDescription>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
        </AlertDialogContent>
      </AlertDialog>,
    );

    const overlay = document.querySelector<HTMLElement>(
      '[data-slot="alert-dialog-overlay"]',
    );
    expect(overlay).not.toBeNull();
    expect(overlay).toHaveClass("bg-background/80", ...MOTION_REDUCE);
    expect(overlay?.className).not.toMatch(/backdrop-blur/);
    expect(overlay).not.toHaveClass("bg-black/10");

    const content = screen.getByRole("alertdialog");
    expect(content).toHaveAttribute("data-slot", "alert-dialog-content");
    expect(content).toHaveClass(...MOTION_REDUCE);
    expect(content.className).not.toMatch(/backdrop-blur/);
  });
});
