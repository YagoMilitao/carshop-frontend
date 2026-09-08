import type { Metadata } from "next";

import { getWorks } from "@/lib/api/works";

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
    <main className="mx-auto flex max-w-3xl flex-col gap-10 px-4 py-8">
      <h1 className="text-2xl font-semibold">Admin</h1>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">Novo work</h2>
        <CreateWorkForm />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">Works</h2>
        {works.length === 0 ? (
          <p className="text-sm text-muted-foreground">
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
        <h2 className="text-lg font-medium">Moderar comentário</h2>
        <CommentModerationForm />
      </section>
    </main>
  );
}
