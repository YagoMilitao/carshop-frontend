"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import {
  approveComment,
  deleteComment,
  updateComment,
} from "@/lib/api/comments.client";
import { getApiErrorMessage } from "@/lib/api/auth.client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { revalidateCommentsTag } from "../actions";

/**
 * `GET /admin/comments` agora existe (CARSHOP-152) e alimenta
 * `PendingCommentsList`, que exibe a fila de comentários `PENDING` na
 * página `/admin`. Este formulário continua operando por `commentId`/
 * `workId` informados manualmente — mantém as ações de moderação
 * (`approveComment`/`updateComment`/`deleteComment`) desacopladas da
 * listagem, sem mudança de contrato do componente.
 */
export function CommentModerationForm() {
  const router = useRouter();
  const [commentId, setCommentId] = useState("");
  const [workId, setWorkId] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const runMutation = async (mutation: () => Promise<void>) => {
    if (!commentId || !workId) {
      setError("Informe o ID do comentário e o ID do work.");
      return;
    }

    setError(null);
    setIsPending(true);

    try {
      await mutation();
      await revalidateCommentsTag(workId);
      router.refresh();
    } catch (mutationError) {
      setError(getApiErrorMessage(mutationError));
    } finally {
      setIsPending(false);
    }
  };

  const onApprove = () => {
    void runMutation(async () => {
      await approveComment(commentId);
    });
  };

  const onUpdate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void runMutation(async () => {
      await updateComment(commentId, { content });
    });
  };

  const onDelete = () => {
    void runMutation(async () => {
      await deleteComment(commentId);
    });
  };

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={onUpdate}
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="comment-id">ID do comentário</Label>
        <Input
          id="comment-id"
          required
          value={commentId}
          onChange={(event) => setCommentId(event.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="comment-work-id">
          ID do work (para invalidar o cache de comentários)
        </Label>
        <Input
          id="comment-work-id"
          required
          value={workId}
          onChange={(event) => setWorkId(event.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="comment-content">
          Novo conteúdo (opcional, para editar)
        </Label>
        <textarea
          id="comment-content"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          className="min-h-24 rounded-lg border border-input bg-transparent px-2.5 py-2 text-body-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      {error && (
        <p role="alert" className="text-body-sm text-destructive-text">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="button" disabled={isPending} onClick={onApprove}>
          Aprovar
        </Button>
        <Button type="submit" variant="secondary" disabled={isPending}>
          Editar
        </Button>
        <Button
          type="button"
          variant="destructive"
          disabled={isPending}
          onClick={onDelete}
        >
          Excluir
        </Button>
      </div>
    </form>
  );
}
