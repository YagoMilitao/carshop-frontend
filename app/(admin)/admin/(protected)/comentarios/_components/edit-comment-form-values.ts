import { z } from "zod";

import type { Comment } from "@/lib/api/comments";
import type {
  EditableCommentStatus,
  UpdateCommentPayload,
} from "@/lib/api/comments.client";

// Limites refletem o contrato real de `PATCH /admin/comments/{commentId}`
// (`authorName` 2–80, `content` 3–1000, `status` PENDING|APPROVED).
export const editCommentSchema = z.object({
  authorName: z
    .string()
    .trim()
    .min(2, "O nome do autor deve ter ao menos 2 caracteres.")
    .max(80, "O nome do autor deve ter no máximo 80 caracteres."),
  content: z
    .string()
    .trim()
    .min(3, "O comentário deve ter ao menos 3 caracteres.")
    .max(1000, "O comentário deve ter no máximo 1000 caracteres."),
  status: z
    .enum(["PENDING", "APPROVED"], { error: "Selecione o status." })
    .optional(),
});

export type EditCommentFormInput = z.input<typeof editCommentSchema>;
export type EditCommentFormValues = z.output<typeof editCommentSchema>;

function toEditableStatus(
  status: Comment["status"],
): EditableCommentStatus | undefined {
  return status === "HIDDEN" ? undefined : status;
}

/**
 * Valores iniciais do formulário. `status` fica `undefined` para
 * comentários `HIDDEN`: o contrato não aceita `HIDDEN` na escrita, então o
 * campo de status nem é exibido nesse caso.
 */
export function mapCommentToFormValues(comment: Comment): EditCommentFormInput {
  return {
    authorName: comment.authorName,
    content: comment.content,
    status: toEditableStatus(comment.status),
  };
}

/**
 * Diff entre o comentário original e os valores validados. Envia apenas os
 * campos alterados; `null` quando nada mudou (nenhuma chamada à API, pois o
 * contrato exige ao menos uma propriedade).
 */
export function buildUpdateCommentPayload(
  original: Comment,
  values: EditCommentFormValues,
): UpdateCommentPayload | null {
  const authorName =
    values.authorName !== original.authorName ? values.authorName : undefined;
  const content =
    values.content !== original.content ? values.content : undefined;
  const status =
    values.status !== undefined && values.status !== original.status
      ? values.status
      : undefined;

  const optional = {
    ...(authorName !== undefined ? { authorName } : {}),
    ...(content !== undefined ? { content } : {}),
    ...(status !== undefined ? { status } : {}),
  };

  if (authorName !== undefined) {
    return { ...optional, authorName };
  }

  if (content !== undefined) {
    return { ...optional, content };
  }

  if (status !== undefined) {
    return { ...optional, status };
  }

  return null;
}
