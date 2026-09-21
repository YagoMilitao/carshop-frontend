/**
 * Módulo isomórfico puro de suporte ao fluxo de redirect-back do login
 * admin. Não usa `"use client"` nem `"server-only"` — apenas Web APIs
 * globais (`URL`, `URLSearchParams`) — porque é importado tanto no Edge
 * (`proxy.ts`) quanto em Server Component (`(protected)/layout.tsx`) e em
 * Client Components (`AuthProvider.tsx`, `admin/login/page.tsx`).
 *
 * `isSafeInternalRedirectPath` é o único vetor real de proteção contra
 * open redirect nesta feature: qualquer valor usado como destino de
 * navegação pós-login deve passar por ela antes de ser usado.
 */

export const REDIRECT_QUERY_PARAM = "redirect";
export const LOGIN_PATH = "/admin/login";
export const DEFAULT_ADMIN_PATH = "/admin";
export const REDIRECT_PATHNAME_HEADER = "x-carshop-pathname";
export const REDIRECT_SEARCH_HEADER = "x-carshop-search";

/** Base opaca usada apenas para parsing via `URL`; nunca exposta como destino. */
const INTERNAL_BASE = "https://internal.local";

/** Caracteres de controle (inclui whitespace) — rejeitados em qualquer posição. */
// eslint-disable-next-line no-control-regex
const CONTROL_OR_WHITESPACE_PATTERN = /[\u0000- \u007f]/;

/**
 * Valida se `candidate` é um caminho interno seguro para uso como destino
 * de redirect (path absoluto, sem escapar para um host externo).
 *
 * `candidate` é tratado como valor opaco: nunca é decodificado ou
 * reconstruído a partir da `URL` parseada — apenas usado como retorno caso
 * seja aprovado.
 */
export function isSafeInternalRedirectPath(
  candidate: unknown,
): candidate is string {
  if (typeof candidate !== "string" || candidate.length === 0) {
    return false;
  }

  if (!candidate.startsWith("/")) {
    return false;
  }

  if (candidate.startsWith("//") || candidate.startsWith("/\\")) {
    return false;
  }

  if (CONTROL_OR_WHITESPACE_PATTERN.test(candidate)) {
    return false;
  }

  try {
    const url = new URL(candidate, INTERNAL_BASE);

    return url.origin === INTERNAL_BASE;
  } catch {
    return false;
  }
}

/**
 * Monta o candidato a destino de redirect-back a partir de `pathname`
 * (+`search`, se houver), retornando `null` quando o redirect-back não é
 * necessário (rota já é `/admin`) ou quando o candidato não é seguro.
 */
export function buildLoginRedirectTarget(
  pathname: string,
  search?: string,
): string | null {
  if (pathname === DEFAULT_ADMIN_PATH) {
    return null;
  }

  const candidate = search && search.length > 0 ? `${pathname}${search}` : pathname;

  if (!isSafeInternalRedirectPath(candidate)) {
    return null;
  }

  return candidate;
}

/**
 * Monta a URL de `/admin/login` incluindo `?redirect=<target>` quando
 * aplicável (via `URLSearchParams`, garantindo o encoding correto).
 */
export function buildLoginUrlWithRedirect(
  pathname: string,
  search?: string,
): string {
  const target = buildLoginRedirectTarget(pathname, search);

  if (target === null) {
    return LOGIN_PATH;
  }

  const params = new URLSearchParams({ [REDIRECT_QUERY_PARAM]: target });

  return `${LOGIN_PATH}?${params.toString()}`;
}
