"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getApiErrorMessage } from "@/lib/api/auth.client";
import { adminCommentsQueryKey, getAdminComments } from "@/lib/api/comments.client";
import { adminWorksQueryKey, getAdminWorks } from "@/lib/api/works.client";

type SummaryCardProps = Readonly<{
  title: string;
  value: string;
  isLoading: boolean;
  error: string | null;
}>;

function SummaryCard({ title, value, isLoading, error }: SummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-label text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error ? (
          <p role="alert" className="text-body-sm text-destructive-text">
            {error}
          </p>
        ) : (
          <output className="text-body-lg font-semibold text-foreground">
            {isLoading ? "…" : value}
          </output>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Client Component: cards de "Visão geral" do dashboard admin. Reaproveita
 * a MESMA `adminWorksQueryKey`/`getAdminWorks()` já usada por
 * `AdminWorkList` — cache compartilhado via `QueryClientProvider` global
 * (`app/providers.tsx`), sem fetch duplicado (decisão do `architect`).
 * Métricas limitadas a: total de works, publicados vs rascunho e
 * comentários pendentes — não inventar métricas adicionais.
 */
export function DashboardSummary() {
  const worksQuery = useQuery({
    queryKey: adminWorksQueryKey,
    queryFn: getAdminWorks,
  });

  const pendingCommentsQuery = useQuery({
    queryKey: adminCommentsQueryKey("PENDING", 1, 20),
    queryFn: () =>
      getAdminComments({ status: "PENDING", page: 1, limit: 20 }),
  });

  const { total, published, draft } = useMemo(() => {
    const works = worksQuery.data ?? [];

    return {
      total: works.length,
      published: works.filter((work) => work.status === "published").length,
      draft: works.filter((work) => work.status === "draft").length,
    };
  }, [worksQuery.data]);

  const worksError = worksQuery.error
    ? getApiErrorMessage(worksQuery.error)
    : null;
  const commentsError = pendingCommentsQuery.error
    ? getApiErrorMessage(pendingCommentsQuery.error)
    : null;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <SummaryCard
        title="Total de works"
        value={String(total)}
        isLoading={worksQuery.isPending}
        error={worksError}
      />
      <SummaryCard
        title="Publicados vs. rascunho"
        value={`${published} / ${draft}`}
        isLoading={worksQuery.isPending}
        error={worksError}
      />
      <SummaryCard
        title="Comentários pendentes"
        value={String(pendingCommentsQuery.data?.total ?? 0)}
        isLoading={pendingCommentsQuery.isPending}
        error={commentsError}
      />
    </div>
  );
}
