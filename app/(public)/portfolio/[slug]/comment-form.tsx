"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { createComment } from "@/lib/api/comments.client";
import { getApiErrorMessage } from "@/lib/api/auth.client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const HTML_TAG_PATTERN = /<(?:!|\/?[a-z])[^>]*>/i;
const NO_HTML_MESSAGE = "Não é permitido incluir HTML ou scripts.";

const commentSchema = z.object({
  authorName: z
    .string()
    .min(1, "Informe seu nome.")
    .refine((value) => !HTML_TAG_PATTERN.test(value), NO_HTML_MESSAGE),
  content: z
    .string()
    .min(1, "Escreva um comentário.")
    .refine((value) => !HTML_TAG_PATTERN.test(value), NO_HTML_MESSAGE),
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
      <output className="text-body-sm text-muted-foreground">
        Comentário enviado! Ele será exibido após aprovação.
      </output>
    );
  }

  return (
    <form
      className="flex flex-col gap-4"
      noValidate
      onSubmit={(event) => void handleSubmit(onSubmit)(event)}
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="comment-author-name">Nome</Label>
        <Input
          id="comment-author-name"
          autoComplete="name"
          aria-invalid={errors.authorName ? "true" : "false"}
          aria-describedby={
            errors.authorName ? "comment-author-name-error" : undefined
          }
          {...register("authorName")}
        />
        {errors.authorName && (
          <p
            id="comment-author-name-error"
            className="text-body-sm text-destructive-text"
          >
            {errors.authorName.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="comment-content">Comentário</Label>
        <textarea
          id="comment-content"
          aria-invalid={errors.content ? "true" : "false"}
          aria-describedby={errors.content ? "comment-content-error" : undefined}
          className="min-h-28 rounded-lg border border-input bg-transparent px-2.5 py-2 text-body-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          {...register("content")}
        />
        {errors.content && (
          <p id="comment-content-error" className="text-body-sm text-destructive-text">
            {errors.content.message}
          </p>
        )}
      </div>

      {formError && (
        <p role="alert" className="text-body-sm text-destructive-text">
          {formError}
        </p>
      )}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Enviando..." : "Enviar comentário"}
      </Button>
    </form>
  );
}
