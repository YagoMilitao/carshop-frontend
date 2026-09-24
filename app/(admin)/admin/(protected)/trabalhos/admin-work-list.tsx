"use client";

import { useQuery } from "@tanstack/react-query";

import { getApiErrorMessage } from "@/lib/api/auth.client";
import {
  adminWorksQueryKey,
  getAdminWorks,
} from "@/lib/api/works.client";

import {
  AdminEmptyState,
  AdminErrorState,
  AdminLoadingState,
} from "../_components/admin-states";

import { WorkListItem } from "./work-list-item";

export function AdminWorkList() {
  const {
    data: works,
    error,
    isPending,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: adminWorksQueryKey,
    queryFn: getAdminWorks,
  });

  if (isPending) {
    return <AdminLoadingState label="Carregando trabalhos..." />;
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

  if (works.length === 0) {
    return (
      <AdminEmptyState
        title="Nenhum trabalho cadastrado."
        description="Use “Novo trabalho” para cadastrar o primeiro."
      />
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {works.map((work) => (
        <WorkListItem key={work.id} work={work} />
      ))}
    </ul>
  );
}
