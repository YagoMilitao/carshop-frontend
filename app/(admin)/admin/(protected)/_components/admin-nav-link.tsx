"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

import type { AdminNavLinkItem } from "./admin-nav-links";

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
  const isActive = pathname === item.href;

  return (
    <Link
      href={item.href}
      aria-current={isActive ? "page" : undefined}
      onClick={onNavigate}
      className={cn(
        "block rounded-lg px-3 py-2 text-body-sm font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
        isActive
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
      )}
    >
      {item.label}
    </Link>
  );
}
