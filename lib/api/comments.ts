import "server-only";

import { serverEnv } from "@/lib/env/server";

/**
 * Camada de acesso a dados de leitura pública de `Comment` (backend
 * `carshop-backend`). Usa `fetch` nativo do Next para Server Components,
 * mesmo padrão de `lib/api/works.ts` — nunca a instância Axios de
 * `lib/api/http.ts` (client-side only, ADR-001).
 */

export type CommentStatus = "PENDING" | "APPROVED";

export type Comment = {
  id: string;
  workId: string;
  authorName: string;
  content: string;
  status: CommentStatus;
  createdAt: string;
  updatedAt: string;
};

/**
 * Tempo de revalidação (ISR) para comentários aprovados de um `Work`, em
 * segundos (5 minutos) — mais curto que `WORKS_REVALIDATE_SECONDS` pois
 * comentários mudam com mais frequência.
 */
export const WORK_COMMENTS_REVALIDATE_SECONDS = 300;

export function workCommentsTag(workId: string): string {
  return `work-comments-${workId}`;
}

/**
 * `GET /works/:workId/comments` (público, lista apenas comentários
 * aprovados — filtro aplicado pelo backend).
 */
export async function getWorkComments(workId: string): Promise<Comment[]> {
  const response = await fetch(
    `${serverEnv.apiUrl}/works/${workId}/comments`,
    {
      next: {
        revalidate: WORK_COMMENTS_REVALIDATE_SECONDS,
        tags: [workCommentsTag(workId)],
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Falha ao buscar comentários: ${response.status}`);
  }

  return (await response.json()) as Comment[];
}
