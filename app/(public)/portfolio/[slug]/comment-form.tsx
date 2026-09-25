"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { createComment } from "@/lib/api/comments.client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const HTML_TAG_PATTERN = /<(?:!|\/?[a-z])[^>]*>/i;
const NO_HTML_MESSAGE = "HTML and scripts are not allowed.";
/**
 * Mensagem local fixa: o backend responde em pt-BR e a página pública é em
 * inglês, então a mensagem da API não é exibida ao visitante.
 */
const SUBMIT_ERROR_MESSAGE = "We couldn't send your comment. Please try again.";

// Limites alinhados ao contrato do backend (`comment.schema.ts`), com `trim`
// aplicado antes da validação e no payload enviado.
const commentSchema = z.object({
  authorName: z
    .string()
    .trim()
    .min(2, "Please enter your name (at least 2 characters).")
    .max(80, "Name must be 80 characters or fewer.")
    .refine((value) => !HTML_TAG_PATTERN.test(value), NO_HTML_MESSAGE),
  content: z
    .string()
    .trim()
    .min(3, "Please write a comment (at least 3 characters).")
    .max(1000, "Comment must be 1,000 characters or fewer.")
    .refine((value) => !HTML_TAG_PATTERN.test(value), NO_HTML_MESSAGE),
});

type CommentFormInput = z.input<typeof commentSchema>;
type CommentFormValues = z.output<typeof commentSchema>;

type CommentFormProps = {
  workId: string;
};

/**
 * Comentário público é criado como `PENDING` (aguardando aprovação de um
 * admin) — por isso não é inserido otimisticamente na lista de aprovados
 * nem dispara invalidação de cache aqui: a única invalidação relevante
 * (`revalidateCommentsTag`) já acontece quando o admin aprova o
 * comentário (`app/(admin)/admin/(protected)/comentarios/`, via
 * `syncAfterCommentMutation`).
 */
export function CommentForm({ workId }: Readonly<CommentFormProps>) {
  const [formError, setFormError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CommentFormInput, unknown, CommentFormValues>({
    resolver: zodResolver(commentSchema),
  });

  const onSubmit = async (values: CommentFormValues) => {
    setFormError(null);

    try {
      await createComment(workId, {
        authorName: values.authorName,
        content: values.content,
      });
      reset();
      setSubmitted(true);
    } catch {
      setFormError(SUBMIT_ERROR_MESSAGE);
    }
  };

  if (submitted) {
    return (
      <output className="text-body-sm text-muted-foreground">
        Thanks — your comment was sent and will appear here once it&apos;s
        approved.
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
        <Label htmlFor="comment-author-name">Name</Label>
        <Input
          id="comment-author-name"
          autoComplete="name"
          className="h-11"
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
        <Label htmlFor="comment-content">Comment</Label>
        <textarea
          id="comment-content"
          aria-invalid={errors.content ? "true" : "false"}
          aria-describedby={errors.content ? "comment-content-error" : undefined}
          className="min-h-32 rounded-lg border border-input bg-transparent px-2.5 py-2 text-body-sm outline-hidden placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-focus-ring"
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

      <Button
        type="submit"
        variant="outline"
        size="lg"
        className="h-11 w-fit px-6"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Sending…" : "Send comment"}
      </Button>
    </form>
  );
}
