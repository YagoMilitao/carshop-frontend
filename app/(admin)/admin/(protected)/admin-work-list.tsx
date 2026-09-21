"use client";

import { useQuery } from "@tanstack/react-query";

import { getApiErrorMessage } from "@/lib/api/auth.client";
import {
  adminWorksQueryKey,
  getAdminWorks,
} from "@/lib/api/works.client";

import { WorkListItem } from "./work-list-item";

export function AdminWorkList() {
  const { data: works, error, isPending } = useQuery({
    queryKey: adminWorksQueryKey,
    queryFn: getAdminWorks,
  });

  if (isPending) {
    return (
      <p role="status" className="text-body-sm text-muted-foreground">
        Carregando trabalhos...
      </p>
    );
  }

  if (error) {
    return (
      <p role="alert" className="text-body-sm text-destructive-text">
        {getApiErrorMessage(error)}
      </p>
    );
  }

  if (works.length === 0) {
    return (
      <p className="text-body-sm text-muted-foreground">
        Nenhum work cadastrado.
      </p>
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
