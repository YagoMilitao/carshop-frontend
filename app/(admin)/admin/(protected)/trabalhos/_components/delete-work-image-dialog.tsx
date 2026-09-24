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

type DeleteWorkImageDialogProps = Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageLabel: string;
  onConfirm: () => void;
  isPending: boolean;
  /**
   * `false` quando uma nova tentativa não faz sentido (ex.: 404 — a imagem
   * já não existe). A ação de confirmar é omitida e sobra só "Fechar".
   */
  canConfirm: boolean;
  error: string | null;
  onCloseAutoFocus?: (event: Event) => void;
}>;

// Componente de apresentação no mesmo padrão de `DeleteWorkDialog`: a
// chamada a `deleteWorkImage` e o mapeamento de erros ficam com quem
// controla `onConfirm` (`WorkListItem`).
export function DeleteWorkImageDialog({
  open,
  onOpenChange,
  imageLabel,
  onConfirm,
  isPending,
  canConfirm,
  error,
  onCloseAutoFocus,
}: DeleteWorkImageDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent onCloseAutoFocus={onCloseAutoFocus}>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir imagem</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir &ldquo;{imageLabel}&rdquo;? Essa
            ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <p role="alert" className="text-body-sm text-destructive-text">
            {error}
          </p>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            {canConfirm ? "Cancelar" : "Fechar"}
          </AlertDialogCancel>
          {canConfirm && (
            <AlertDialogAction
              variant="destructive"
              disabled={isPending}
              onClick={(event) => {
                // Mantém o diálogo aberto até o resultado do DELETE: quem
                // fecha é o `WorkListItem`, só em caso de sucesso.
                event.preventDefault();
                onConfirm();
              }}
            >
              {isPending ? "Excluindo..." : "Excluir imagem"}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
