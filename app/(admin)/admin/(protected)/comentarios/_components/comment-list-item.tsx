"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Comment } from "@/lib/api/comments";
import {
  adminCommentsBaseQueryKey,
  approveComment,
  updateComment,
} from "@/lib/api/comments.client";

import {
  getCommentModerationErrorMessage,
  isNotFoundError,
} from "./comment-moderation-error";
import { syncAfterCommentMutation } from "./comment-moderation-sync";
import {
  commentStatusBadgeVariants,
  commentStatusLabels,
} from "./comment-status";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

type QuickAction = "approve" | "revertToPending";

type CommentListItemProps = Readonly<{
  comment: Comment;
  /** Título do work quando já resolvido; senão exibe o `workId`. */
  workTitle?: string;
  onRequestEdit: (comment: Comment, trigger: HTMLButtonElement) => void;
  onRequestDelete: (comment: Comment, trigger: HTMLButtonElement) => void;
}>;

/**
 * Item da listagem de moderação. As ações rápidas (Aprovar / Voltar para
 * pendente) têm mutação própria por item: o estado pendente/erro nunca vaza
 * para outros comentários. Editar/Excluir apenas pedem ao painel para abrir
 * o diálogo correspondente (os diálogos vivem no nível do painel).
 */
export function CommentListItem({
  comment,
  workTitle,
  onRequestEdit,
  onRequestDelete,
}: CommentListItemProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (action: QuickAction) =>
      action === "approve"
        ? approveComment(comment.id)
        : updateComment(comment.id, { status: "PENDING" }),
    onSuccess: async (_updated, action) => {
      await syncAfterCommentMutation(queryClient, comment.workId);
      toast.success(
        action === "approve"
          ? "Comentário aprovado."
          : "Comentário voltou para pendente.",
      );
    },
    onError: (error) => {
      // 401 já passou pelo interceptor de `lib/api/http.ts` (refresh e, se
      // falhar, `onAuthFailure`); aqui só exibimos o feedback.
      toast.error(getCommentModerationErrorMessage(error));
      if (isNotFoundError(error)) {
        void queryClient.invalidateQueries({
          queryKey: adminCommentsBaseQueryKey,
        });
      }
    },
  });

  const isPending = mutation.isPending;
  const pendingAction = isPending ? mutation.variables : undefined;

  const srTarget = (
    <>
      {" "}
      <span className="sr-only">comentário de {comment.authorName}</span>
    </>
  );

  return (
    <li className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-body-sm font-semibold text-foreground">
          {comment.authorName}
        </span>
        <Badge variant={commentStatusBadgeVariants[comment.status]}>
          {commentStatusLabels[comment.status]}
        </Badge>
        <time
          dateTime={comment.createdAt}
          className="text-body-sm text-muted-foreground"
        >
          {dateFormatter.format(new Date(comment.createdAt))}
        </time>
      </div>

      <p className="text-body-sm text-muted-foreground">
        Trabalho:{" "}
        {workTitle ?? <code className="break-all">{comment.workId}</code>}
      </p>

      <p className="whitespace-pre-line break-words text-body-sm text-foreground">
        {comment.content}
      </p>

      <div className="flex flex-wrap gap-2 md:justify-end">
        {comment.status === "PENDING" && (
          <Button
            type="button"
            size="sm"
            disabled={isPending}
            onClick={() => mutation.mutate("approve")}
          >
            {pendingAction === "approve" ? "Aprovando..." : "Aprovar"}
            {srTarget}
          </Button>
        )}

        {comment.status === "APPROVED" && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => mutation.mutate("revertToPending")}
          >
            {pendingAction === "revertToPending"
              ? "Atualizando..."
              : "Voltar para pendente"}
            {srTarget}
          </Button>
        )}

        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={(event) => onRequestEdit(comment, event.currentTarget)}
        >
          Editar
          {srTarget}
        </Button>

        <Button
          type="button"
          size="sm"
          variant="destructive"
          disabled={isPending}
          onClick={(event) => onRequestDelete(comment, event.currentTarget)}
        >
          Excluir
          {srTarget}
        </Button>
      </div>
    </li>
  );
}
