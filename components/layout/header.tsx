import Link from "next/link"
import { navLinks } from "./nav-links"
import { MobileNav } from "./mobile-nav"
import { Container } from "./container"
import { Button } from "@/components/ui/button"

export function Header() {
  return (
    <header className="relative h-16 border-b border-border bg-background">
      <Container variant="page" className="flex h-16 items-center justify-between">
        <Link
          href="/"
          className="rounded-lg text-heading-4 text-foreground outline-hidden focus-visible:ring-3 focus-visible:ring-focus-ring"
        >
          CarShop
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          <nav aria-label="Navegação principal">
            <ul className="flex items-center gap-6">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="rounded-lg text-nav text-foreground outline-hidden hover:text-foreground/80 focus-visible:ring-3 focus-visible:ring-focus-ring"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <Button
            variant="default"
            disabled
            aria-disabled="true"
            aria-label="Get a Quote (coming soon)"
          >
            Get a Quote
          </Button>
        </div>

        <MobileNav />
      </Container>
    </header>
  )
}
