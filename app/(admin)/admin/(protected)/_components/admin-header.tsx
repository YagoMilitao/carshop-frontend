import { AdminMobileNav } from "./admin-mobile-nav";
import { AdminAccountMenu } from "./admin-account-menu";

/**
 * Server Component: chrome estático do header admin, embutindo os Client
 * Components mínimos necessários (`AdminMobileNav`, `AdminAccountMenu`).
 */
export function AdminHeader() {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-border bg-surface px-5 py-3 sm:px-8 lg:px-8">
      <div className="flex items-center gap-2">
        <AdminMobileNav />
        <span className="text-body-lg font-semibold text-foreground">
          CarShop Admin
        </span>
      </div>
      <AdminAccountMenu />
    </header>
  );
}
