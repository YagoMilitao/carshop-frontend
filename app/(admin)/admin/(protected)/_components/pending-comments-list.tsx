"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/lib/api/auth.client";
import { adminCommentsQueryKey, getAdminComments } from "@/lib/api/comments.client";

import { commentDateFormatter } from "../comentarios/_components/comment-date";

import {
  AdminEmptyState,
  AdminErrorState,
  AdminLoadingState,
} from "./admin-states";
import { useAdminWorkTitles } from "./use-admin-work-titles";

const COMMENTS_PER_PAGE = 20;

/**
 * Client Component: lista real de comentários `PENDING` (`useQuery`),
 * consumindo `GET /admin/comments` (contrato confirmado no backend real —
 * `carshop-backend/src/infra/docs/admin-comments.swagger.ts`). Somente
 * leitura: a moderação acontece em `/admin/comentarios`. O título do
 * trabalho vem de `useAdminWorkTitles` (mesma query de works, não
 * bloqueante; fallback para o `workId`).
 */
export function PendingCommentsList() {
  const [page, setPage] = useState(1);
  const workTitles = useAdminWorkTitles();
  const { data, error, isPending, isFetching, refetch } = useQuery({
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
      <AdminLoadingState label="Carregando comentários pendentes..." rows={2} />
    );
  }

  if (error) {
    return (
      <AdminErrorState
        message={getApiErrorMessage(error)}
        onRetry={() => void refetch()}
        isRetrying={isFetching}
      />
    );
  }

  if (data.items.length === 0 && page === 1) {
    return <AdminEmptyState title="Nenhum comentário pendente de moderação." />;
  }

  return (
    <div className="flex flex-col gap-4">
      {data.items.length === 0 && (
        <AdminEmptyState title="Nenhum comentário nesta página." />
      )}

      <ul className="flex flex-col gap-3">
        {data.items.map((comment) => {
          const workTitle = workTitles?.get(comment.workId);

          return (
            <li
              key={comment.id}
              className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-4"
            >
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="text-body-sm font-semibold text-foreground">
                  {comment.authorName}
                </span>
                <time
                  dateTime={comment.createdAt}
                  className="text-body-sm text-muted-foreground"
                >
                  {commentDateFormatter.format(new Date(comment.createdAt))}
                </time>
              </div>
              <p className="text-body-sm text-muted-foreground">
                Trabalho:{" "}
                {workTitle ?? (
                  <code className="break-all">{comment.workId}</code>
                )}
              </p>
              <p className="whitespace-pre-line break-words text-body-sm text-foreground">
                {comment.content}
              </p>
            </li>
          );
        })}
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
