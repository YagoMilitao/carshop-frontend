"use client";

import { useQuery } from "@tanstack/react-query";

import { getApiErrorMessage } from "@/lib/api/auth.client";
import { adminCommentsQueryKey, getAdminComments } from "@/lib/api/comments.client";

/**
 * Client Component: lista real de comentários `PENDING` (`useQuery`),
 * consumindo `GET /admin/comments` (contrato confirmado no backend real —
 * `carshop-backend/src/infra/docs/admin-comments.swagger.ts`). Cobre a
 * lacuna de listagem de comentários que antes não existia no admin.
 */
export function PendingCommentsList() {
  const { data, error, isPending } = useQuery({
    queryKey: adminCommentsQueryKey("PENDING"),
    queryFn: () => getAdminComments({ status: "PENDING" }),
  });

  if (isPending) {
    return (
      <output className="text-body-sm text-muted-foreground">
        Carregando comentários pendentes...
      </output>
    );
  }

  if (error) {
    return (
      <p role="alert" className="text-body-sm text-destructive-text">
        {getApiErrorMessage(error)}
      </p>
    );
  }

  if (data.items.length === 0) {
    return (
      <p className="text-body-sm text-muted-foreground">
        Nenhum comentário pendente de moderação.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {data.items.map((comment) => (
        <li
          key={comment.id}
          className="flex flex-col gap-1 rounded-lg border border-border bg-surface p-3"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-body-sm font-semibold text-foreground">
              {comment.authorName}
            </span>
            <span className="text-body-sm text-muted-foreground">
              Work: {comment.workId}
            </span>
          </div>
          <p className="text-body-sm text-foreground">{comment.content}</p>
        </li>
      ))}
    </ul>
  );
}
