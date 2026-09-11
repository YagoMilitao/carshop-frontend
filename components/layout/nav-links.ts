export interface NavLink {
  href: string
  label: string
}

export const navLinks: NavLink[] = [
  { href: "/", label: "Início" },
  { href: "/about", label: "Sobre" },
  { href: "/services", label: "Serviços" },
  { href: "/portfolio", label: "Portfólio" },
  { href: "/contact", label: "Contato" },
]
