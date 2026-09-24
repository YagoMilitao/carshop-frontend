"use client";

import { useId, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Comment } from "@/lib/api/comments";
import {
  updateComment,
  type UpdateCommentPayload,
} from "@/lib/api/comments.client";

import {
  getCommentModerationErrorMessage,
  isNotFoundError,
} from "./comment-moderation-error";
import { syncAfterCommentMutation } from "./comment-moderation-sync";
import {
  buildUpdateCommentPayload,
  editCommentSchema,
  mapCommentToFormValues,
  type EditCommentFormInput,
  type EditCommentFormValues,
} from "./edit-comment-form-values";

const fieldClassName =
  "rounded-lg border border-input bg-transparent px-2.5 py-2 text-body-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive";

type EditCommentDialogProps = Readonly<{
  open: boolean;
  /** Snapshot do comentário no momento em que o diálogo foi aberto. */
  comment: Comment;
  onOpenChange: (open: boolean) => void;
  /** Chamado após salvar com sucesso (antes de fechar o diálogo). */
  onSaved: () => void;
  /** Chamado em 404: o painel invalida a listagem imediatamente. */
  onNotFound: () => void;
  onCloseAutoFocus?: (event: Event) => void;
}>;

/**
 * Diálogo de edição (autor, conteúdo e status `PENDING`|`APPROVED`). Deve
 * ser remontado (via `key`) a cada abertura, para que formulário e mutação
 * comecem limpos. Vive no nível do painel — nunca dentro do `<li>` —
 * para não desmontar durante refetch da listagem.
 */
export function EditCommentDialog({
  open,
  comment,
  onOpenChange,
  onSaved,
  onNotFound,
  onCloseAutoFocus,
}: EditCommentDialogProps) {
  const queryClient = useQueryClient();
  const idPrefix = useId();
  const authorId = `${idPrefix}-author`;
  const contentId = `${idPrefix}-content`;
  const statusId = `${idPrefix}-status`;

  const [noChanges, setNoChanges] = useState(false);
  const [isNotFound, setIsNotFound] = useState(false);

  const canEditStatus = comment.status !== "HIDDEN";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditCommentFormInput, unknown, EditCommentFormValues>({
    resolver: zodResolver(editCommentSchema),
    defaultValues: mapCommentToFormValues(comment),
  });

  const mutation = useMutation({
    mutationFn: (payload: UpdateCommentPayload) =>
      updateComment(comment.id, payload),
    onSuccess: async () => {
      await syncAfterCommentMutation(queryClient, comment.workId);
      toast.success("Comentário atualizado.");
      onSaved();
      onOpenChange(false);
    },
    onError: (error) => {
      if (isNotFoundError(error)) {
        setIsNotFound(true);
        onNotFound();
      }
    },
  });

  const isPending = mutation.isPending;

  const onSubmit = (values: EditCommentFormValues) => {
    const payload = buildUpdateCommentPayload(comment, values);

    if (payload === null) {
      setNoChanges(true);
      return;
    }

    setNoChanges(false);
    mutation.mutate(payload);
  };

  const preventCloseWhilePending = (event: Event) => {
    if (isPending) {
      event.preventDefault();
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        // Não permite fechar (Esc/Cancelar/clique fora) com o PATCH em
        // andamento.
        if (!nextOpen && isPending) {
          return;
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-lg"
        onEscapeKeyDown={preventCloseWhilePending}
        onInteractOutside={preventCloseWhilePending}
        onCloseAutoFocus={onCloseAutoFocus}
      >
        <DialogHeader>
          <DialogTitle>Editar comentário</DialogTitle>
          <DialogDescription>
            Altere o autor, o conteúdo ou o status. Apenas os campos alterados
            são enviados.
          </DialogDescription>
        </DialogHeader>

        <form
          className="flex flex-col gap-4"
          noValidate
          onSubmit={(event) => void handleSubmit(onSubmit)(event)}
        >
          <fieldset disabled={isPending} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={authorId}>Autor</Label>
              <Input
                id={authorId}
                aria-invalid={errors.authorName ? "true" : "false"}
                aria-describedby={
                  errors.authorName ? `${authorId}-error` : undefined
                }
                {...register("authorName")}
              />
              {errors.authorName && (
                <p
                  id={`${authorId}-error`}
                  className="text-body-sm text-destructive-text"
                >
                  {errors.authorName.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor={contentId}>Comentário</Label>
              <textarea
                id={contentId}
                aria-invalid={errors.content ? "true" : "false"}
                aria-describedby={
                  errors.content ? `${contentId}-error` : undefined
                }
                className={`min-h-32 ${fieldClassName}`}
                {...register("content")}
              />
              {errors.content && (
                <p
                  id={`${contentId}-error`}
                  className="text-body-sm text-destructive-text"
                >
                  {errors.content.message}
                </p>
              )}
            </div>

            {canEditStatus && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={statusId}>Status</Label>
                <select
                  id={statusId}
                  aria-invalid={errors.status ? "true" : "false"}
                  aria-describedby={
                    errors.status ? `${statusId}-error` : undefined
                  }
                  className={fieldClassName}
                  {...register("status")}
                >
                  <option value="PENDING">Pendente</option>
                  <option value="APPROVED">Aprovado</option>
                </select>
                {errors.status && (
                  <p
                    id={`${statusId}-error`}
                    className="text-body-sm text-destructive-text"
                  >
                    {errors.status.message}
                  </p>
                )}
              </div>
            )}
          </fieldset>

          {noChanges && (
            <output className="text-body-sm text-muted-foreground">
              Nenhuma alteração para salvar.
            </output>
          )}

          {mutation.error && (
            <p role="alert" className="text-body-sm text-destructive-text">
              {getCommentModerationErrorMessage(mutation.error)}
            </p>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isPending}>
                {isNotFound ? "Fechar" : "Cancelar"}
              </Button>
            </DialogClose>
            {!isNotFound && (
              <Button type="submit" disabled={isPending}>
                {isPending ? "Salvando..." : "Salvar"}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
