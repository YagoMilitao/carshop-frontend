import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/api/auth.server";
import { AuthProvider } from "@/lib/auth/AuthProvider";

import { AdminShell } from "./_components/admin-shell";

// Dados de sessão (`getSession()`) nunca podem ser estáticos/cacheados —
// dependem do cookie da request atual.
export const dynamic = "force-dynamic";

/**
 * Camada 2 de proteção das rotas `/admin/*` (complementar ao `proxy`,
 * camada 1). Engloba todas as rotas admin exceto `/admin/login`, que vive
 * fora deste grupo de rota — ver `app/(admin)/admin/layout.tsx`.
 *
 * Extensão CARSHOP-152: passa a envolver `children` em `<AdminShell>`
 * (sidebar + header do dashboard admin), mantendo `getSession()`/
 * `redirect`/`AuthProvider` inalterados.
 */
export default async function ProtectedAdminLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const session = await getSession();

  if (!session) {
    redirect("/admin/login");
  }

  return (
    <AuthProvider initialUser={session.user}>
      <AdminShell>{children}</AdminShell>
    </AuthProvider>
  );
}
