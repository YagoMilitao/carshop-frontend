import { describe, it } from "vitest";
import { render } from "@testing-library/react";

import { expectModalSurface } from "@/test/assertions/modal-surface";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "./alert-dialog";

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

    expectModalSurface({
      overlaySlot: "alert-dialog-overlay",
      contentRole: "alertdialog",
      contentSlot: "alert-dialog-content",
    });
  });
});
