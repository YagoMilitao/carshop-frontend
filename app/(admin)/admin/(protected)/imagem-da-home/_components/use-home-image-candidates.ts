import { useQuery } from "@tanstack/react-query";

import { adminWorksQueryKey, getAdminWorks } from "@/lib/api/works.client";

import {
  selectHomeImageCandidates,
  type HomeImageCandidateGroup,
} from "./home-image-candidates";

export type UseHomeImageCandidatesResult = {
  groups: HomeImageCandidateGroup[] | undefined;
  isPending: boolean;
  error: Error | null;
  isFetching: boolean;
  refetch: () => Promise<unknown>;
};

/**
 * Única fonte das imagens candidatas à Home. Hoje reutiliza a listagem
 * admin completa de works (mesmo cache de `/admin/trabalhos`) filtrada no
 * cliente — risco aceito pelo usuário; o endpoint paginado/filtrado futuro
 * é CARSHOP-172. Consumidores usam o `refetch` daqui e nunca invalidam
 * `adminWorksQueryKey` diretamente, para que a troca de fonte fique
 * restrita a este hook.
 */
export function useHomeImageCandidates(): UseHomeImageCandidatesResult {
  const { data, isPending, error, isFetching, refetch } = useQuery({
    queryKey: adminWorksQueryKey,
    queryFn: getAdminWorks,
    // Referência estável (nível de módulo): o `select` só reexecuta quando
    // os dados mudam.
    select: selectHomeImageCandidates,
  });

  return { groups: data, isPending, error, isFetching, refetch };
}
