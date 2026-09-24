/**
 * Itens reais de navegação do admin (decisões do `architect`, CARSHOP-152,
 * CARSHOP-35 — "Comentários" — e CARSHOP-148). A navegação lista apenas
 * seções; ações como "Novo trabalho" vivem como CTA na página da seção
 * (`/admin/trabalhos`). Não inventar seções ("Usuários"/"Configurações")
 * sem decisão de arquitetura adicional.
 */
export type AdminNavLinkItem = {
  href: string;
  label: string;
  /**
   * `exact`: ativo apenas quando o pathname é igual ao `href` (ex.: `/admin`,
   * que é prefixo de todas as rotas). `prefix`: ativo também em sub-rotas
   * (ex.: `/admin/trabalhos/novo`, `/admin/trabalhos/[slug]/editar`).
   */
  match: "exact" | "prefix";
};

export const adminNavLinks: readonly AdminNavLinkItem[] = [
  { href: "/admin", label: "Dashboard", match: "exact" },
  { href: "/admin/trabalhos", label: "Trabalhos", match: "prefix" },
  { href: "/admin/comentarios", label: "Comentários", match: "prefix" },
];

export function isAdminNavItemActive(
  pathname: string,
  item: Pick<AdminNavLinkItem, "href" | "match">,
): boolean {
  if (pathname === item.href) {
    return true;
  }

  return item.match === "prefix" && pathname.startsWith(`${item.href}/`);
}
