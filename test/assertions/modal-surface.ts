import { screen } from "@testing-library/react";
import { expect } from "vitest";

const MOTION_REDUCE = [
  "motion-reduce:data-open:animate-none",
  "motion-reduce:data-closed:animate-none",
];

type ModalSurfaceOptions = {
  overlaySlot: string;
  contentRole: "alertdialog" | "dialog";
  contentSlot: string;
};

export function expectModalSurface({
  overlaySlot,
  contentRole,
  contentSlot,
}: ModalSurfaceOptions): HTMLElement {
  const overlay = document.querySelector<HTMLElement>(`[data-slot="${overlaySlot}"]`);
  expect(overlay).not.toBeNull();
  expect(overlay).toHaveClass("bg-background/80", ...MOTION_REDUCE);
  expect(overlay?.className).not.toMatch(/backdrop-blur/);
  expect(overlay).not.toHaveClass("bg-black/10");

  const content = screen.getByRole(contentRole);
  expect(content).toHaveAttribute("data-slot", contentSlot);
  expect(content).toHaveClass(...MOTION_REDUCE);
  expect(content.className).not.toMatch(/backdrop-blur/);

  return content;
}
