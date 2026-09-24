import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { PageSection } from "@/components/layout/page-section";

import {
  parseCommentFilters,
  type CommentSearchParams,
} from "./_components/comment-filters";
import { CommentModerationPanel } from "./_components/comment-moderation-panel";
import { CommentStatusFilter } from "./_components/comment-status-filter";

// Defesa em profundidade, complementar a `app/(admin)/admin/layout.tsx`:
// Admin nunca é tratado como conteúdo público indexável.
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

type AdminCommentsPageProps = Readonly<{
  searchParams: Promise<CommentSearchParams>;
}>;

// Server Component: filtro e página vêm da URL (`?status=`, `?page=`).
// `AdminShell` (layout.tsx) já fornece o landmark `<main>`.
export default async function AdminCommentsPage({
  searchParams,
}: AdminCommentsPageProps) {
  const filter = parseCommentFilters(await searchParams);

  return (
    <PageSection spacing="compact" container="none">
      <Container variant="page" className="flex flex-col gap-8">
        <h1 className="text-heading-2 text-foreground">Comentários</h1>

        <CommentStatusFilter current={filter.status} />

        <CommentModerationPanel status={filter.status} page={filter.page} />
      </Container>
    </PageSection>
  );
}
