import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { PageSection } from "@/components/layout/page-section";

import { EditWorkForm } from "./edit-work-form";

// Defesa em profundidade, complementar a `app/(admin)/admin/layout.tsx`:
// Admin nunca é tratado como conteúdo público indexável.
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

type EditWorkPageProps = {
  params: Promise<{ slug: string }>;
};

// Server Component fino: Axios é client-only (ADR-001), então o
// carregamento do work por slug acontece inteiramente em `EditWorkForm`.
export default async function EditWorkPage({ params }: Readonly<EditWorkPageProps>) {
  const { slug } = await params;

  return (
    <PageSection spacing="compact" container="none">
      <Container variant="reading" className="flex flex-col gap-10">
        <h1 className="text-heading-2 text-foreground">Editar trabalho</h1>

        <EditWorkForm slug={slug} />
      </Container>
    </PageSection>
  );
}
