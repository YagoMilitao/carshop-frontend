import { useQuery } from "@tanstack/react-query";

import { adminWorksQueryKey, getAdminWorks } from "@/lib/api/works.client";

/**
 * Mapa `workId → título` a partir da listagem admin de works já existente
 * (mesma query key/cache de `/admin/trabalhos`; sem endpoint novo). Não
 * bloqueante: enquanto não resolve (ou se falhar), os consumidores exibem
 * o `workId` como fallback.
 */
export function useAdminWorkTitles(): ReadonlyMap<string, string> | undefined {
  const { data } = useQuery({
    queryKey: adminWorksQueryKey,
    queryFn: getAdminWorks,
    select: (works) => new Map(works.map((work) => [work.id, work.title])),
  });

  return data;
}
