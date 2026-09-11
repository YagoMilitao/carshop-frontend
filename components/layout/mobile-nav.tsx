"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { cn } from "cn"
import { navLinks } from "./nav-links"

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls="mobile-nav-panel"
        aria-label={isOpen ? "Fechar menu de navegação" : "Abrir menu de navegação"}
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center justify-center rounded-lg p-2 text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {isOpen ? <X className="size-6" aria-hidden="true" /> : <Menu className="size-6" aria-hidden="true" />}
      </button>

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
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-foreground outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  )
}
