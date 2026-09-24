import type { QueryClient } from "@tanstack/react-query";

import { adminCommentsBaseQueryKey } from "@/lib/api/comments.client";

import { revalidateCommentsTag } from "../../../actions";

/**
 * Sincroniza, após uma mutação bem-sucedida, o cache do TanStack Query
 * (todas as queries de comentários admin — todos os status/páginas,
 * incluindo as do dashboard) e a tag pública do Next
 * (`work-comments-{workId}`). Falhas aqui nunca viram falha da ação.
 */
export async function syncAfterCommentMutation(
  queryClient: QueryClient,
  workId: string,
): Promise<void> {
  await Promise.allSettled([
    queryClient.invalidateQueries({ queryKey: adminCommentsBaseQueryKey }),
    revalidateCommentsTag(workId),
  ]);
}
