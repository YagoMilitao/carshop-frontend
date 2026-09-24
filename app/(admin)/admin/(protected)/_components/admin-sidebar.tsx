import { adminNavLinks } from "./admin-nav-links";
import { AdminNavLink } from "./admin-nav-link";

/**
 * Server Component: composição manual com tokens semânticos existentes
 * (`--surface`, `--border`, `--muted-foreground`, `--accent`) — decisão do
 * `architect` de NÃO reintroduzir os tokens `--sidebar-*` (removidos no ADR-009
 * addendum CARSHOP-74) nem usar o primitivo `sidebar` completo do Shadcn
 * para poucos links. Fixa (sticky) em telas `lg+`, com a marca "CarShop
 * Admin" no topo; abaixo disso o menu vive em `AdminMobileNav` (drawer) e a
 * marca aparece em `AdminHeader`.
 */
export function AdminSidebar() {
  return (
    <div className="hidden w-56 shrink-0 flex-col gap-6 border-r border-border bg-surface p-4 lg:sticky lg:top-0 lg:flex lg:h-dvh">
      <p className="px-3 pt-1 text-body-lg font-semibold text-foreground">
        CarShop Admin
      </p>
      <nav aria-label="Navegação administrativa">
        <ul className="flex flex-col gap-1">
          {adminNavLinks.map((item) => (
            <li key={item.href}>
              <AdminNavLink item={item} />
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
