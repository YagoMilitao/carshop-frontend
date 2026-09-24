import type { CommentStatus } from "@/lib/api/comments";

/**
 * Filtro de status da tela de moderação. `ALL` não é um valor do contrato:
 * representa a ausência do query param `status` em `GET /admin/comments`.
 */
export type CommentFilterStatus = CommentStatus | "ALL";

export type CommentFilters = Readonly<{
  status: CommentFilterStatus;
  page: number;
}>;

export type CommentSearchParams = Readonly<
  Record<string, string | string[] | undefined>
>;

export const DEFAULT_COMMENT_FILTER_STATUS: CommentFilterStatus = "PENDING";

export const COMMENT_FILTER_STATUSES: readonly CommentFilterStatus[] = [
  "PENDING",
  "APPROVED",
  "HIDDEN",
  "ALL",
];

const COMMENTS_BASE_PATH = "/admin/comentarios";

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function isCommentFilterStatus(value: string): value is CommentFilterStatus {
  return COMMENT_FILTER_STATUSES.some((status) => status === value);
}

function parsePage(value: string | undefined): number {
  if (value === undefined || !/^\d+$/.test(value)) {
    return 1;
  }

  const page = Number(value);

  return Number.isSafeInteger(page) && page >= 1 ? page : 1;
}

/**
 * Lê `?status=` e `?page=` da URL (primeiro valor quando repetidos).
 * Status ausente/inválido → `PENDING` (fila de moderação); página
 * ausente/inválida/`< 1`/não inteira → `1`.
 */
export function parseCommentFilters(
  searchParams: CommentSearchParams,
): CommentFilters {
  const rawStatus = firstValue(searchParams.status);

  return {
    status:
      rawStatus !== undefined && isCommentFilterStatus(rawStatus)
        ? rawStatus
        : DEFAULT_COMMENT_FILTER_STATUS,
    page: parsePage(firstValue(searchParams.page)),
  };
}

/** Monta o href da tela omitindo os valores padrão (`PENDING`, página 1). */
export function buildCommentsHref({
  status,
  page = 1,
}: Readonly<{ status: CommentFilterStatus; page?: number }>): string {
  const params = new URLSearchParams();

  if (status !== DEFAULT_COMMENT_FILTER_STATUS) {
    params.set("status", status);
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const query = params.toString();

  return query ? `${COMMENTS_BASE_PATH}?${query}` : COMMENTS_BASE_PATH;
}

/** `ALL` → sem filtro (`status` omitido na chamada à API). */
export function toApiStatus(
  status: CommentFilterStatus,
): CommentStatus | undefined {
  return status === "ALL" ? undefined : status;
}
