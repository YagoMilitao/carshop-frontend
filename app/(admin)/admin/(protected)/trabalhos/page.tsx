import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { PageSection } from "@/components/layout/page-section";

import { AdminWorkList } from "./admin-work-list";

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
export default function AdminWorksPage() {
  return (
    <PageSection spacing="compact" container="none">
      <Container variant="page" className="flex flex-col gap-10">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-heading-2 text-foreground">Trabalhos</h1>
          <Button asChild>
            <Link href="/admin/trabalhos/novo">Novo trabalho</Link>
          </Button>
        </div>

        <AdminWorkList />
      </Container>
    </PageSection>
  );
}
