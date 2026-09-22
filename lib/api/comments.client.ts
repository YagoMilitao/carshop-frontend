import { http } from "@/lib/api/http";
import type { Comment, CommentStatus } from "@/lib/api/comments";

/**
 * Camada de acesso a dados de mutações de `Comment` (Axios, via instância
 * única de `lib/api/http.ts` — ADR-001). Leitura pública continua em
 * `lib/api/comments.ts` (`fetch`, Server Components).
 */

export type CreateCommentPayload = {
  authorName: string;
  content: string;
};

/**
 * `POST /works/:workId/comments` (público — sem autenticação; resulta em
 * comentário `PENDING` até aprovação de um admin).
 */
export async function createComment(
  workId: string,
  payload: CreateCommentPayload,
): Promise<Comment> {
  const response = await http.post<Comment>(
    `/works/${workId}/comments`,
    payload,
  );

  return response.data;
}

/** `PATCH /admin/comments/:commentId/approve` (admin, autenticado). */
export async function approveComment(commentId: string): Promise<Comment> {
  const response = await http.patch<Comment>(
    `/admin/comments/${commentId}/approve`,
  );

  return response.data;
}

export type UpdateCommentPayload = {
  content: string;
};

/** `PATCH /admin/comments/:commentId` (admin, autenticado). */
export async function updateComment(
  commentId: string,
  payload: UpdateCommentPayload,
): Promise<Comment> {
  const response = await http.patch<Comment>(
    `/admin/comments/${commentId}`,
    payload,
  );

  return response.data;
}

/** `DELETE /admin/comments/:commentId` (admin, autenticado). */
export async function deleteComment(commentId: string): Promise<void> {
  await http.delete(`/admin/comments/${commentId}`);
}

/**
 * Resposta paginada de `GET /admin/comments`, conforme
 * `AdminCommentListResponse` (contrato confirmado em
 * `carshop-backend/src/infra/docs/admin-comments.swagger.ts` e
 * `list-comments-for-moderation.use-case.ts` — envelope com `items` +
 * metadados de paginação, nunca array simples).
 */
export type AdminCommentListResponse = {
  items: Comment[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type GetAdminCommentsParams = {
  status?: CommentStatus;
  page?: number;
  limit?: number;
};

export const adminCommentsQueryKey = (status?: CommentStatus) =>
  ["admin", "comments", status] as const;

/**
 * `GET /admin/comments` (admin, autenticado). Lista comentários para
 * moderação, com filtro opcional por `status` e paginação
 * (`page`/`limit`, padrão 1/20 no backend).
 */
export async function getAdminComments(
  params: GetAdminCommentsParams = {},
): Promise<AdminCommentListResponse> {
  const response = await http.get<AdminCommentListResponse>(
    "/admin/comments",
    { params },
  );

  return response.data;
}
