"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

import { isAdminNavItemActive, type AdminNavLinkItem } from "./admin-nav-links";

/**
 * Client Component isolado apenas por causa de `usePathname()` — necessário
 * para destacar o item ativo da navegação admin. Fronteira mínima (o resto
 * do shell permanece Server).
 */
export function AdminNavLink({
  item,
  onNavigate,
}: Readonly<{ item: AdminNavLinkItem; onNavigate?: () => void }>) {
  const pathname = usePathname();
  const isActive = isAdminNavItemActive(pathname, item);

  return (
    <Link
      href={item.href}
      aria-current={isActive ? "page" : undefined}
      onClick={onNavigate}
      className={cn(
        // Indicador lateral `primary` via pseudo-elemento: marca o item ativo
        // sem depender só de cor de fundo (aria-current continua sendo a
        // semântica para tecnologias assistivas).
        "relative block rounded-lg px-3 py-2 text-nav outline-none transition-colors motion-reduce:transition-none before:absolute before:inset-y-1.5 before:left-0 before:w-0.5 before:rounded-full focus-visible:ring-3 focus-visible:ring-focus-ring",
        isActive
          ? "bg-accent text-foreground before:bg-primary"
          : "text-muted-foreground before:bg-transparent hover:bg-accent hover:text-foreground",
      )}
    >
      {item.label}
    </Link>
  );
}
