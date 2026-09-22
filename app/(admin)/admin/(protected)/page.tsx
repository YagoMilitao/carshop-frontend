import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { PageSection } from "@/components/layout/page-section";

import { CommentModerationForm } from "./comment-moderation-form";
import { AdminWorkList } from "./admin-work-list";
import { DashboardSummary } from "./_components/dashboard-summary";
import { PendingCommentsList } from "./_components/pending-comments-list";

// Defesa em profundidade, complementar a `app/(admin)/admin/layout.tsx`:
// Admin nunca é tratado como conteúdo público indexável.
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

// Server Component puro (sem "use client"): `AdminShell` (layout.tsx) já
// fornece o landmark `<main>` do admin — esta página não deve renderizar
// outro `<main>` aninhado.
export default function AdminPage() {
  return (
    <PageSection spacing="compact" container="none">
      <Container variant="page" className="flex flex-col gap-10">
        <h1 className="text-heading-2 text-foreground">Dashboard</h1>

        <section className="flex flex-col gap-4">
          <h2 className="text-body-lg font-semibold text-foreground">
            Visão geral
          </h2>
          <DashboardSummary />
        </section>

        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-body-lg font-semibold text-foreground">
              Works
            </h2>
            <Button asChild>
              <Link href="/admin/trabalhos/novo">Novo trabalho</Link>
            </Button>
          </div>
          <AdminWorkList />
        </section>

        <section className="flex flex-col gap-6">
          <h2 className="text-body-lg font-semibold text-foreground">
            Comentários
          </h2>

          <div className="flex flex-col gap-3">
            <h3 className="text-body-sm font-semibold text-muted-foreground">
              Pendentes de moderação
            </h3>
            <PendingCommentsList />
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="text-body-sm font-semibold text-muted-foreground">
              Moderar comentário
            </h3>
            <CommentModerationForm />
          </div>
        </section>
      </Container>
    </PageSection>
  );
}
