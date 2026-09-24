import type { CommentStatus } from "@/lib/api/comments";

import type { CommentFilterStatus } from "./comment-filters";

type CommentStatusBadgeVariant = "outline" | "success" | "secondary";

export const commentStatusLabels: Readonly<Record<CommentStatus, string>> = {
  PENDING: "Pendente",
  APPROVED: "Aprovado",
  HIDDEN: "Oculto",
};

export const commentStatusBadgeVariants: Readonly<
  Record<CommentStatus, CommentStatusBadgeVariant>
> = {
  PENDING: "outline",
  APPROVED: "success",
  HIDDEN: "secondary",
};

export const commentFilterLabels: Readonly<
  Record<CommentFilterStatus, string>
> = {
  PENDING: "Pendentes",
  APPROVED: "Aprovados",
  HIDDEN: "Ocultos",
  ALL: "Todos",
};
