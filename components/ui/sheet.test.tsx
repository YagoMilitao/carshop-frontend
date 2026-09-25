import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";

import { expectModalSurface } from "@/test/assertions/modal-surface";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "./sheet";

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

    const content = expectModalSurface({
      overlaySlot: "sheet-overlay",
      contentRole: "dialog",
      contentSlot: "sheet-content",
    });
    expect(content).toHaveAttribute("data-side", "left");
  });
});
