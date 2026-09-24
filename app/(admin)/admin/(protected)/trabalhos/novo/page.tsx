import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { PageSection } from "@/components/layout/page-section";

import { AdminPageHeader } from "../../_components/admin-page-header";

import { CreateWorkForm } from "./create-work-form";

// Defesa em profundidade, complementar a `app/(admin)/admin/layout.tsx`:
// Admin nunca é tratado como conteúdo público indexável.
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function NewWorkPage() {
  return (
    <PageSection spacing="compact" container="none">
      <Container variant="reading" className="flex flex-col gap-8">
        <AdminPageHeader title="Novo trabalho" />

        <CreateWorkForm />
      </Container>
    </PageSection>
  );
}
