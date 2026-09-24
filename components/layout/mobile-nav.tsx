"use client"

import { useState } from "react"
import Link from "next/link"
import { LuMenu, LuX } from "react-icons/lu"
import { cn } from "cn"
import { navLinks } from "./nav-links"
import { Button } from "@/components/ui/button"

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="md:hidden">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-11"
        aria-expanded={isOpen}
        aria-controls="mobile-nav-panel"
        aria-label={isOpen ? "Fechar menu de navegação" : "Abrir menu de navegação"}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {isOpen ? <LuX className="size-6" aria-hidden="true" /> : <LuMenu className="size-6" aria-hidden="true" />}
      </Button>

      <div
        id="mobile-nav-panel"
        className={cn(
          "absolute inset-x-0 top-full z-50 origin-top border-b border-border bg-background shadow-md transition-all",
          isOpen ? "block" : "hidden",
        )}
      >
        <nav aria-label="Navegação principal (mobile)">
          <ul className="flex flex-col gap-1 p-4">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="block rounded-lg px-3 py-3 text-sm font-medium text-foreground outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-border p-4">
          <Button
            variant="default"
            className="w-full"
            disabled
            aria-disabled="true"
            aria-label="Get a Quote (coming soon)"
          >
            Get a Quote
          </Button>
        </div>
      </div>
    </div>
  )
}
