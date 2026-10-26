import "server-only";

import { serverEnv } from "@/lib/env/server";
import { HttpError } from "./errors";
import { withRetryBackoff, type RetryOptions } from "./retry";

/**
 * Camada de acesso a dados de leitura pública de `Comment` (backend
 * `carshop-backend`). Usa `fetch` nativo do Next para Server Components,
 * mesmo padrão de `lib/api/works.ts` — nunca a instância Axios de
 * `lib/api/http.ts` (client-side only, ADR-001).
 */

export type CommentStatus = "PENDING" | "APPROVED" | "HIDDEN";

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

export type GetWorkCommentsOptions = {
  /** Orçamento de retry; ausente → padrão de `withRetryBackoff` (ADR-019). */
  retry?: RetryOptions;
  /** Limite de duração de cada tentativa; ausente → sem timeout. */
  timeoutMs?: number;
};

/**
 * `GET /works/:workId/comments` (público, lista apenas comentários
 * aprovados — filtro aplicado pelo backend).
 *
 * Sem `options` o comportamento é o original (usado por
 * `/portfolio/[slug]`). Com `timeoutMs`, cada tentativa usa um
 * `AbortController` novo (mesmo padrão de `getWorks`/`getHomeImage`). A URL,
 * `revalidate` e `tags` não mudam em nenhum caso: o Data Cache é
 * compartilhado entre a página do projeto e a Home, e a invalidação por tag
 * feita na moderação (`revalidateCommentsTag`) vale para ambas.
 */
export async function getWorkComments(
  workId: string,
  options?: GetWorkCommentsOptions,
): Promise<Comment[]> {
  const timeoutMs = options?.timeoutMs;

  return withRetryBackoff(async () => {
    const controller =
      timeoutMs === undefined ? undefined : new AbortController();
    const timeoutId = controller
      ? setTimeout(() => controller.abort(), timeoutMs)
      : undefined;

    try {
      const response = await fetch(
        `${serverEnv.apiUrl}/works/${workId}/comments`,
        {
          ...(controller ? { signal: controller.signal } : {}),
          next: {
            revalidate: WORK_COMMENTS_REVALIDATE_SECONDS,
            tags: [workCommentsTag(workId)],
          },
        },
      );

      if (!response.ok) {
        throw new HttpError(
          `Falha ao buscar comentários: ${response.status}`,
          response.status,
        );
      }

      return (await response.json()) as Comment[];
    } finally {
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
    }
  }, options?.retry);
}
