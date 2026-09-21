import Link from "next/link"
import { navLinks } from "./nav-links"
import { Container } from "./container"
import { serverEnv } from "@/lib/env/server"

const socialLinks = [
  { href: serverEnv.social.instagramUrl, label: "Instagram" },
  { href: serverEnv.social.facebookUrl, label: "Facebook" },
  { href: serverEnv.social.linkedinUrl, label: "LinkedIn" },
].filter(
  (link): link is { href: string; label: string } => Boolean(link.href),
)

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-background">
      <Container
        variant="page"
        className="flex flex-col gap-6 py-8 md:flex-row md:items-start md:justify-between"
      >
        <div>
          <p className="text-nav text-foreground">CarShop</p>
          <p className="mt-1 text-body-sm text-muted-foreground">
            &copy; {currentYear} CarShop. Todos os direitos reservados.
          </p>
        </div>

        <nav aria-label="Links institucionais">
          <ul className="flex flex-col gap-2 text-body-sm md:flex-row md:gap-6">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="rounded-lg text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {socialLinks.length > 0 && (
          <nav aria-label="Redes sociais">
            <ul className="flex flex-col gap-2 text-body-sm md:flex-row md:gap-6">
              {socialLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </Container>
    </footer>
  )
}
