import { describe, it } from "vitest";
import { render } from "@testing-library/react";

import { expectModalSurface } from "@/test/assertions/modal-surface";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "./dialog";

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

    expectModalSurface({
      overlaySlot: "dialog-overlay",
      contentRole: "dialog",
      contentSlot: "dialog-content",
    });
  });
});
