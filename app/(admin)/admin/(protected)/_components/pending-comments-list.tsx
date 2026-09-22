"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/lib/api/auth.client";
import { adminCommentsQueryKey, getAdminComments } from "@/lib/api/comments.client";

const COMMENTS_PER_PAGE = 20;

/**
 * Client Component: lista real de comentários `PENDING` (`useQuery`),
 * consumindo `GET /admin/comments` (contrato confirmado no backend real —
 * `carshop-backend/src/infra/docs/admin-comments.swagger.ts`). Cobre a
 * lacuna de listagem de comentários que antes não existia no admin.
 */
export function PendingCommentsList() {
  const [page, setPage] = useState(1);
  const { data, error, isPending, isFetching } = useQuery({
    queryKey: adminCommentsQueryKey("PENDING", page, COMMENTS_PER_PAGE),
    queryFn: () =>
      getAdminComments({
        status: "PENDING",
        page,
        limit: COMMENTS_PER_PAGE,
      }),
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

  if (data.items.length === 0 && page === 1) {
    return (
      <p className="text-body-sm text-muted-foreground">
        Nenhum comentário pendente de moderação.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {data.items.length === 0 && (
        <p className="text-body-sm text-muted-foreground">
          Nenhum comentário nesta página.
        </p>
      )}

      <ul className="flex flex-col gap-3">
        {data.items.map((comment) => (
          <li
            key={comment.id}
            className="flex flex-col gap-1 rounded-lg border border-border bg-surface p-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-body-sm font-semibold text-foreground">
                {comment.authorName}
              </span>
              <span className="text-body-sm text-muted-foreground">
                Work: {comment.workId}
              </span>
            </div>
            <p className="text-body-sm text-muted-foreground">
              ID do comentário: <code className="break-all">{comment.id}</code>
            </p>
            <p className="text-body-sm text-foreground">{comment.content}</p>
          </li>
        ))}
      </ul>

      {(page > 1 || data.totalPages > 1) && (
        <nav
          aria-label="Paginação de comentários pendentes"
          className="flex flex-wrap items-center justify-between gap-3"
        >
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page === 1 || isFetching}
            onClick={() => setPage((currentPage) => currentPage - 1)}
          >
            Anterior
          </Button>
          <span className="text-body-sm text-muted-foreground">
            Página {data.page} de {Math.max(1, data.totalPages)}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= data.totalPages || isFetching}
            onClick={() => setPage((currentPage) => currentPage + 1)}
          >
            Próxima
          </Button>
        </nav>
      )}
    </div>
  );
}
