import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { PageSection } from "@/components/layout/page-section";

import { AdminPageHeader } from "../_components/admin-page-header";

import { HomeImageSettings } from "./_components/home-image-settings";

// Defesa em profundidade, complementar a `app/(admin)/admin/layout.tsx`:
// Admin nunca é tratado como conteúdo público indexável.
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

// Server Component: a única fronteira client é `HomeImageSettings`.
// `AdminShell` (layout.tsx) já fornece o landmark `<main>`.
export default function AdminHomeImagePage() {
  return (
    <PageSection spacing="compact" container="none">
      <Container variant="page" className="flex flex-col gap-8">
        <AdminPageHeader
          title="Imagem da Home"
          description="Escolha a foto principal exibida no topo da página inicial. Apenas imagens de trabalhos publicados podem ser usadas."
        />

        <HomeImageSettings />
      </Container>
    </PageSection>
  );
}
