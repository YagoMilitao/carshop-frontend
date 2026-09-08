"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { createComment } from "@/lib/api/comments.client";
import { getApiErrorMessage } from "@/lib/api/auth.client";
import { Button } from "@/components/ui/button";

const commentSchema = z.object({
  authorName: z.string().min(1, "Informe seu nome."),
  content: z.string().min(1, "Escreva um comentário."),
});

type CommentFormValues = z.infer<typeof commentSchema>;

type CommentFormProps = {
  workId: string;
};

/**
 * Comentário público é criado como `PENDING` (aguardando aprovação de um
 * admin) — por isso não é inserido otimisticamente na lista de aprovados
 * nem dispara invalidação de cache aqui: a única invalidação relevante
 * (`revalidateCommentsTag`) já acontece quando o admin aprova o
 * comentário (`app/(admin)/admin/(protected)/comment-moderation-form.tsx`).
 */
export function CommentForm({ workId }: Readonly<CommentFormProps>) {
  const [formError, setFormError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CommentFormValues>({
    resolver: zodResolver(commentSchema),
  });

  const onSubmit = async (values: CommentFormValues) => {
    setFormError(null);

    try {
      await createComment(workId, values);
      reset();
      setSubmitted(true);
    } catch (error) {
      setFormError(getApiErrorMessage(error));
    }
  };

  if (submitted) {
    return (
      <p role="status" className="text-sm text-muted-foreground">
        Comentário enviado! Ele será exibido após aprovação.
      </p>
    );
  }

  return (
    <form
      className="flex flex-col gap-4"
      noValidate
      onSubmit={(event) => void handleSubmit(onSubmit)(event)}
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="comment-author-name" className="text-sm font-medium">
          Nome
        </label>
        <input
          id="comment-author-name"
          autoComplete="name"
          aria-invalid={errors.authorName ? "true" : "false"}
          aria-describedby={
            errors.authorName ? "comment-author-name-error" : undefined
          }
          className="h-9 rounded-lg border border-border bg-background px-2.5 text-sm"
          {...register("authorName")}
        />
        {errors.authorName && (
          <p
            id="comment-author-name-error"
            className="text-xs text-destructive"
          >
            {errors.authorName.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="comment-content" className="text-sm font-medium">
          Comentário
        </label>
        <textarea
          id="comment-content"
          aria-invalid={errors.content ? "true" : "false"}
          aria-describedby={errors.content ? "comment-content-error" : undefined}
          className="rounded-lg border border-border bg-background px-2.5 py-2 text-sm"
          {...register("content")}
        />
        {errors.content && (
          <p id="comment-content-error" className="text-xs text-destructive">
            {errors.content.message}
          </p>
        )}
      </div>

      {formError && (
        <p role="alert" className="text-sm text-destructive">
          {formError}
        </p>
      )}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Enviando..." : "Enviar comentário"}
      </Button>
    </form>
  );
}
