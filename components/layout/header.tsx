import Link from "next/link"
import { navLinks } from "./nav-links"
import { MobileNav } from "./mobile-nav"
import { Container } from "./container"
import { Button } from "@/components/ui/button"
import { ContactAnchorLink } from "@/components/contact/contact-anchor-link"

export function Header() {
  return (
    <header className="relative h-16 border-b border-border bg-background">
      <Container variant="page" className="flex h-16 items-center justify-between">
        <Link
          href="/"
          className="rounded-lg text-heading-4 text-foreground outline-hidden focus-visible:ring-3 focus-visible:ring-focus-ring"
        >
          DreamUP Auto Interiors
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

          <Button asChild variant="default">
            <ContactAnchorLink>Get a Quote</ContactAnchorLink>
          </Button>
        </div>

        <MobileNav />
      </Container>
    </header>
  )
}
