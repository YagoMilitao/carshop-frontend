import { http } from "@/lib/api/http";
import type { Comment } from "@/lib/api/comments";

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
