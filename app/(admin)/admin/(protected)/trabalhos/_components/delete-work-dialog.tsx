"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type DeleteWorkDialogProps = Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workTitle: string;
  onConfirm: () => void;
  isPending: boolean;
  error: string | null;
}>;

// Componente de apresentação: não conhece `deleteWork`/Axios diretamente.
// A mutação real é responsabilidade de quem controla `onConfirm`
// (`WorkListItem`), mantendo este diálogo reutilizável e testável de forma
// isolada.
export function DeleteWorkDialog({
  open,
  onOpenChange,
  workTitle,
  onConfirm,
  isPending,
  error,
}: DeleteWorkDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir work</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir &ldquo;{workTitle}&rdquo;? Essa
            ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <p role="alert" className="text-body-sm text-destructive-text">
            {error}
          </p>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isPending}
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
          >
            {isPending ? "Excluindo..." : "Excluir"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
