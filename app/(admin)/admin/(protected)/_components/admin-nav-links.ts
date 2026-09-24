/**
 * Itens reais de navegação do admin (decisões do `architect`, CARSHOP-152 e
 * CARSHOP-35 — "Comentários"). Não inventar seções
 * ("Usuários"/"Configurações") sem decisão de arquitetura adicional.
 */
export type AdminNavLinkItem = {
  href: string;
  label: string;
};

export const adminNavLinks: readonly AdminNavLinkItem[] = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/trabalhos", label: "Trabalhos" },
  { href: "/admin/trabalhos/novo", label: "Novo trabalho" },
  { href: "/admin/comentarios", label: "Comentários" },
];
