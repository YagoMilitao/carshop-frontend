import { adminNavLinks } from "./admin-nav-links";
import { AdminNavLink } from "./admin-nav-link";

/**
 * Server Component: composição manual com tokens semânticos existentes
 * (`--surface`, `--border`, `--muted-foreground`, `--accent`) — decisão do
 * `architect` de NÃO reintroduzir os tokens `--sidebar-*` (removidos no ADR-009
 * addendum CARSHOP-74) nem usar o primitivo `sidebar` completo do Shadcn
 * para apenas 2 links. Fixa em telas `lg+`; abaixo disso o menu vive em
 * `AdminMobileNav` (drawer).
 */
export function AdminSidebar() {
  return (
    <nav
      aria-label="Navegação administrativa"
      className="hidden w-56 shrink-0 border-r border-border bg-surface p-4 lg:block"
    >
      <ul className="flex flex-col gap-1">
        {adminNavLinks.map((item) => (
          <li key={item.href}>
            <AdminNavLink item={item} />
          </li>
        ))}
      </ul>
    </nav>
  );
}
