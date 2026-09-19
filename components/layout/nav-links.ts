export interface NavLink {
  href: string
  label: string
}

export const navLinks: NavLink[] = [
  { href: "/services", label: "Services" },
  { href: "/portfolio", label: "Our Work" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
]
