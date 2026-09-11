import Link from "next/link"
import { navLinks } from "./nav-links"

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">CarShop</p>
          <p className="mt-1 text-sm text-muted-foreground">
            &copy; {currentYear} CarShop. Todos os direitos reservados.
          </p>
        </div>

        <nav aria-label="Links institucionais">
          <ul className="flex flex-col gap-2 text-sm md:flex-row md:gap-6">
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
      </div>
    </footer>
  )
}
