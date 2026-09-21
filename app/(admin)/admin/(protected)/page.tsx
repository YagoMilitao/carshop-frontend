import type { Metadata } from "next";

import { getWorks } from "@/lib/api/works";
import { Container } from "@/components/layout/container";
import { PageSection } from "@/components/layout/page-section";

import { CommentModerationForm } from "./comment-moderation-form";
import { CreateWorkForm } from "./create-work-form";
import { WorkListItem } from "./work-list-item";

// Defesa em profundidade, complementar a `app/(admin)/admin/layout.tsx`:
// Admin nunca é tratado como conteúdo público indexável.
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminPage() {
  const works = await getWorks();

  return (
    <PageSection as="main" spacing="compact" container="none">
      <Container variant="reading" className="flex flex-col gap-10">
        <h1 className="text-heading-2 text-foreground">Admin</h1>

        <section className="flex flex-col gap-4">
          <h2 className="text-body-lg font-semibold text-foreground">
            Novo work
          </h2>
          <CreateWorkForm />
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-body-lg font-semibold text-foreground">
            Works
          </h2>
          {works.length === 0 ? (
            <p className="text-body-sm text-muted-foreground">
              Nenhum work cadastrado.
            </p>
          ) : (
            <ul className="flex flex-col gap-4">
              {works.map((work) => (
                <WorkListItem key={work.id} work={work} />
              ))}
            </ul>
          )}
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-body-lg font-semibold text-foreground">
            Moderar comentário
          </h2>
          <CommentModerationForm />
        </section>
      </Container>
    </PageSection>
  );
}
