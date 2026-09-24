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

type DeleteCommentDialogProps = Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  authorName: string;
  excerpt: string;
  onConfirm: () => void;
  isPending: boolean;
  /**
   * `false` quando uma nova tentativa não faz sentido (404 — o comentário
   * já não existe). A ação de confirmar é omitida e sobra só "Fechar".
   */
  canConfirm: boolean;
  error: string | null;
  onCloseAutoFocus?: (event: Event) => void;
}>;

const EXCERPT_MAX_LENGTH = 80;

export function getCommentExcerpt(content: string): string {
  return content.length > EXCERPT_MAX_LENGTH
    ? `${content.slice(0, EXCERPT_MAX_LENGTH)}…`
    : content;
}

// Componente de apresentação no padrão de `DeleteWorkImageDialog`: a
// chamada a `deleteComment` e o mapeamento de erros ficam com quem controla
// `onConfirm` (`CommentModerationPanel`).
export function DeleteCommentDialog({
  open,
  onOpenChange,
  authorName,
  excerpt,
  onConfirm,
  isPending,
  canConfirm,
  error,
  onCloseAutoFocus,
}: DeleteCommentDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent onCloseAutoFocus={onCloseAutoFocus}>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir comentário</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir o comentário de {authorName}
            {excerpt ? <> (&ldquo;{excerpt}&rdquo;)</> : null}? Essa ação não
            pode ser desfeita.
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
                // fecha é o painel, só em caso de sucesso.
                event.preventDefault();
                onConfirm();
              }}
            >
              {isPending ? "Excluindo..." : "Excluir comentário"}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
