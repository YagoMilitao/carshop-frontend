import type { ReactNode } from "react";

import { AuthProvider } from "@/lib/auth/AuthProvider";

/**
 * `/admin/login` fica fora do grupo `(protected)` (não exige sessão
 * válida), mas ainda precisa de um `AuthProvider` próprio para expor
 * `useAuth().login()` ao formulário — instanciado com `initialUser: null`
 * (usuário ainda não autenticado nesta rota).
 */
export default function AdminLoginLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return <AuthProvider initialUser={null}>{children}</AuthProvider>;
}
