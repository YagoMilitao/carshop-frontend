import type { ReactNode } from "react";

import { AdminSidebar } from "./admin-sidebar";
import { AdminHeader } from "./admin-header";

/**
 * Server Component: composição estática do shell admin (sidebar fixa
 * desktop + header + `<main>`). Nenhum estado/efeito aqui — os únicos
 * pedaços interativos (`AdminMobileNav`, `AdminAccountMenu`, `AdminNavLink`)
 * já isolam sua própria fronteira `"use client"`.
 */
export function AdminShell({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
