import { AdminMobileNav } from "./admin-mobile-nav";
import { AdminAccountMenu } from "./admin-account-menu";

/**
 * Server Component: chrome estático do header admin, embutindo os Client
 * Components mínimos necessários (`AdminMobileNav`, `AdminAccountMenu`).
 * Em `lg+` a marca vive na `AdminSidebar`; aqui ela aparece só abaixo de
 * `lg`, e o menu da conta fica alinhado à direita.
 */
export function AdminHeader() {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-border bg-surface px-5 py-3 sm:px-8 lg:justify-end lg:px-8">
      <div className="flex items-center gap-2 lg:hidden">
        <AdminMobileNav />
        <span className="text-body-lg font-semibold text-foreground">
          CarShop Admin
        </span>
      </div>
      <AdminAccountMenu />
    </header>
  );
}
