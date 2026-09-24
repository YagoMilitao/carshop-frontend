"use client";

import { useId, useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { Comment } from "@/lib/api/comments";
import {
  adminCommentsBaseQueryKey,
  adminCommentsQueryKey,
  deleteComment,
  getAdminComments,
} from "@/lib/api/comments.client";

import {
  AdminEmptyState,
  AdminErrorState,
  AdminLoadingState,
} from "../../_components/admin-states";
import { useAdminWorkTitles } from "../../_components/use-admin-work-titles";

import {
  buildCommentsHref,
  toApiStatus,
  type CommentFilterStatus,
} from "./comment-filters";
import { CommentListItem } from "./comment-list-item";
import {
  getCommentModerationErrorMessage,
  isNotFoundError,
} from "./comment-moderation-error";
import { syncAfterCommentMutation } from "./comment-moderation-sync";
import { DeleteCommentDialog, getCommentExcerpt } from "./delete-comment-dialog";
import { EditCommentDialog } from "./edit-comment-dialog";

export const COMMENTS_PER_PAGE = 20;

const headingByStatus: Readonly<Record<CommentFilterStatus, string>> = {
  PENDING: "Comentários pendentes",
  APPROVED: "Comentários aprovados",
  HIDDEN: "Comentários ocultos",
  ALL: "Todos os comentários",
};

const emptyMessageByStatus: Readonly<Record<CommentFilterStatus, string>> = {
  PENDING: "Nenhum comentário pendente de moderação.",
  APPROVED: "Nenhum comentário aprovado.",
  HIDDEN: "Nenhum comentário oculto.",
  ALL: "Nenhum comentário recebido até o momento.",
};

type CommentModerationPanelProps = Readonly<{
  status: CommentFilterStatus;
  page: number;
}>;

/**
 * Client Component: listagem real (`GET /admin/comments`) com filtro e
 * página vindos da URL (lidos pela página, Server Component). Possui os
 * diálogos de edição e exclusão — um único de cada, no nível do painel,
 * com snapshot do comentário — para que um refetch da lista nunca os
 * desmonte.
 */
export function CommentModerationPanel({
  status,
  page,
}: CommentModerationPanelProps) {
  const queryClient = useQueryClient();
  const headingId = useId();
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const focusHeadingOnCloseRef = useRef(false);

  const apiStatus = toApiStatus(status);

  const { data, error, isPending, isFetching, refetch } = useQuery({
    queryKey: adminCommentsQueryKey(apiStatus, page, COMMENTS_PER_PAGE),
    queryFn: () =>
      getAdminComments({ status: apiStatus, page, limit: COMMENTS_PER_PAGE }),
    // Mantém a página anterior visível durante a troca de página, mas
    // nunca mostra dados de outro status ao trocar o filtro.
    placeholderData: (previousData, previousQuery) =>
      previousQuery?.queryKey[2] === apiStatus ? previousData : undefined,
  });

  // Títulos dos works (não bloqueante): sem eles, o item mostra o `workId`.
  const workTitles = useAdminWorkTitles();

  const [editTarget, setEditTarget] = useState<Comment | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editSession, setEditSession] = useState(0);

  const [deleteTarget, setDeleteTarget] = useState<Comment | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [canConfirmDelete, setCanConfirmDelete] = useState(true);

  const deleteMutation = useMutation({
    mutationFn: (comment: Comment) => deleteComment(comment.id),
    onSuccess: async (_result, comment) => {
      await syncAfterCommentMutation(queryClient, comment.workId);
      toast.success("Comentário excluído.");
      focusHeadingOnCloseRef.current = true;
      setIsDeleteOpen(false);
    },
    onError: (mutationError) => {
      if (isNotFoundError(mutationError)) {
        focusHeadingOnCloseRef.current = true;
        setCanConfirmDelete(false);
        void queryClient.invalidateQueries({
          queryKey: adminCommentsBaseQueryKey,
        });
      }
      setDeleteError(getCommentModerationErrorMessage(mutationError));
    },
  });

  const onRequestEdit = (comment: Comment, trigger: HTMLButtonElement) => {
    triggerRef.current = trigger;
    focusHeadingOnCloseRef.current = false;
    setEditTarget(comment);
    setEditSession((session) => session + 1);
    setIsEditOpen(true);
  };

  const onRequestDelete = (comment: Comment, trigger: HTMLButtonElement) => {
    triggerRef.current = trigger;
    focusHeadingOnCloseRef.current = false;
    deleteMutation.reset();
    setDeleteError(null);
    setCanConfirmDelete(true);
    setDeleteTarget(comment);
    setIsDeleteOpen(true);
  };

  const onDeleteOpenChange = (open: boolean) => {
    // Não permite fechar (Esc/Cancelar) com o DELETE em andamento.
    if (!open && deleteMutation.isPending) {
      return;
    }
    setIsDeleteOpen(open);
  };

  const onEditNotFound = () => {
    focusHeadingOnCloseRef.current = true;
    void queryClient.invalidateQueries({ queryKey: adminCommentsBaseQueryKey });
  };

  // Diálogos controlados, sem `Trigger`: o Radix mandaria o foco para o
  // `body`. Cancelar/Esc → volta ao botão que abriu o diálogo; sucesso,
  // 404 ou botão fora do DOM (refetch) → heading da listagem.
  const onDialogCloseAutoFocus = (event: Event) => {
    event.preventDefault();

    const trigger = triggerRef.current;
    triggerRef.current = null;

    if (!focusHeadingOnCloseRef.current && trigger?.isConnected) {
      trigger.focus();
    } else {
      headingRef.current?.focus();
    }

    focusHeadingOnCloseRef.current = false;
  };

  const totalPages = Math.max(1, data?.totalPages ?? 1);
  const showPagination =
    data !== undefined && (page > 1 || data.totalPages > 1);

  return (
    <section
      aria-labelledby={headingId}
      aria-busy={isFetching}
      className="flex flex-col gap-4"
    >
      <h2
        id={headingId}
        ref={headingRef}
        tabIndex={-1}
        className="text-body-lg font-semibold text-foreground outline-none focus-visible:ring-3 focus-visible:ring-focus-ring"
      >
        {headingByStatus[status]}
        {data ? ` (${data.total})` : null}
      </h2>

      {isPending && <AdminLoadingState label="Carregando comentários..." />}

      {error && (
        <AdminErrorState
          message={getCommentModerationErrorMessage(error)}
          onRetry={() => void refetch()}
          isRetrying={isFetching}
        />
      )}

      {data?.items.length === 0 && page === 1 && (
        <AdminEmptyState
          title={emptyMessageByStatus[status]}
          description={
            status === "HIDDEN"
              ? "Ocultar comentários ainda não está disponível no painel."
              : undefined
          }
        />
      )}

      {data?.items.length === 0 && page > 1 && (
        <AdminEmptyState title="Nenhum comentário nesta página." />
      )}

      {data && data.items.length > 0 && (
        <ul className="flex flex-col gap-3">
          {data.items.map((comment) => (
            <CommentListItem
              key={comment.id}
              comment={comment}
              workTitle={workTitles?.get(comment.workId)}
              onRequestEdit={onRequestEdit}
              onRequestDelete={onRequestDelete}
            />
          ))}
        </ul>
      )}

      {showPagination && (
        <nav
          aria-label="Paginação de comentários"
          className="flex flex-wrap items-center justify-between gap-3"
        >
          {page > 1 ? (
            <Button asChild variant="outline" size="sm">
              <Link
                href={buildCommentsHref({ status, page: page - 1 })}
                scroll={false}
              >
                Anterior
              </Link>
            </Button>
          ) : (
            <Button type="button" variant="outline" size="sm" disabled>
              Anterior
            </Button>
          )}
          <span className="text-body-sm text-muted-foreground">
            Página {page} de {totalPages}
          </span>
          {page < totalPages ? (
            <Button asChild variant="outline" size="sm">
              <Link
                href={buildCommentsHref({ status, page: page + 1 })}
                scroll={false}
              >
                Próxima
              </Link>
            </Button>
          ) : (
            <Button type="button" variant="outline" size="sm" disabled>
              Próxima
            </Button>
          )}
        </nav>
      )}

      {editTarget && (
        <EditCommentDialog
          key={editSession}
          open={isEditOpen}
          comment={editTarget}
          onOpenChange={setIsEditOpen}
          onSaved={() => {
            focusHeadingOnCloseRef.current = true;
          }}
          onNotFound={onEditNotFound}
          onCloseAutoFocus={onDialogCloseAutoFocus}
        />
      )}

      <DeleteCommentDialog
        open={isDeleteOpen}
        onOpenChange={onDeleteOpenChange}
        authorName={deleteTarget?.authorName ?? ""}
        excerpt={deleteTarget ? getCommentExcerpt(deleteTarget.content) : ""}
        onConfirm={() => {
          if (deleteTarget) {
            setDeleteError(null);
            deleteMutation.mutate(deleteTarget);
          }
        }}
        isPending={deleteMutation.isPending}
        canConfirm={canConfirmDelete}
        error={deleteError}
        onCloseAutoFocus={onDialogCloseAutoFocus}
      />
    </section>
  );
}
