/**
 * Itens reais de navegação do admin (decisão do `architect`, CARSHOP-152).
 * Apenas 2 itens — não inventar seções ("Usuários"/"Configurações") sem
 * decisão de arquitetura adicional.
 */
export type AdminNavLinkItem = {
  href: string;
  label: string;
};

export const adminNavLinks: readonly AdminNavLinkItem[] = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/trabalhos/novo", label: "Novo trabalho" },
];
