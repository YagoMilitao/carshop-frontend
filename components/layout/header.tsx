import Link from "next/link"
import { navLinks } from "./nav-links"
import { MobileNav } from "./mobile-nav"

export function Header() {
  return (
    <header className="relative border-b border-border bg-background">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link
          href="/"
          className="rounded-lg text-lg font-semibold text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          CarShop
        </Link>

        <nav aria-label="Navegação principal" className="hidden md:flex">
          <ul className="flex items-center gap-6">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="rounded-lg text-sm font-medium text-foreground outline-none hover:text-foreground/80 focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <MobileNav />
      </div>
    </header>
  )
}
