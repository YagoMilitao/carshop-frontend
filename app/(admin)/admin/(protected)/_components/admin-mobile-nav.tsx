"use client";

import { useEffect, useState } from "react";
import { LuMenu } from "react-icons/lu";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { adminNavLinks } from "./admin-nav-links";
import { AdminNavLink } from "./admin-nav-link";

/**
 * Client Component: trigger + drawer (Shadcn `sheet`) para navegação admin
 * abaixo do breakpoint `lg`, onde `AdminSidebar` fica oculta. Decisão do
 * `architect`: usar `sheet`, não reaproveitar `Dialog`.
 */
export function AdminMobileNav() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const desktopMediaQuery = window.matchMedia("(min-width: 64rem)");
    const closeOnDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setIsOpen(false);
      }
    };

    desktopMediaQuery.addEventListener("change", closeOnDesktop);

    return () => {
      desktopMediaQuery.removeEventListener("change", closeOnDesktop);
    };
  }, []);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label="Abrir menu de navegação"
        >
          <LuMenu className="size-5" aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>Navegação administrativa</SheetTitle>
        </SheetHeader>
        <nav aria-label="Navegação administrativa (mobile)" className="px-4">
          <ul className="flex flex-col gap-1">
            {adminNavLinks.map((item) => (
              <li key={item.href}>
                <AdminNavLink item={item} onNavigate={() => setIsOpen(false)} />
              </li>
            ))}
          </ul>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
