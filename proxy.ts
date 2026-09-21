import { NextResponse, type NextRequest } from "next/server";

import {
  REDIRECT_PATHNAME_HEADER,
  REDIRECT_SEARCH_HEADER,
  buildLoginUrlWithRedirect,
} from "@/lib/auth/redirect";

/**
 * Camada 1 de proteção das rotas `/admin/*` (defesa em profundidade,
 * complementar à camada 2 em `app/(admin)/admin/layout.tsx`). Checagem
 * barata: apenas a existência do cookie `refresh_token` — **não** chama o
 * backend aqui (isso é responsabilidade de `auth.server#getSession()` no
 * layout, que valida a sessão de fato).
 *
 * Propaga o pathname/search reais da request (nunca confiando em headers
 * vindos do client) via `REDIRECT_PATHNAME_HEADER`/`REDIRECT_SEARCH_HEADER`,
 * incondicionalmente e antes de qualquer `return`, para que
 * `(protected)/layout.tsx` consiga montar o `?redirect=` mesmo sem receber
 * `searchParams` nativamente.
 */
export function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(REDIRECT_PATHNAME_HEADER, request.nextUrl.pathname);
  requestHeaders.set(REDIRECT_SEARCH_HEADER, request.nextUrl.search);

  if (request.nextUrl.pathname === "/admin/login") {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const hasRefreshToken = request.cookies.has("refresh_token");

  if (!hasRefreshToken) {
    const loginTarget = buildLoginUrlWithRedirect(
      request.nextUrl.pathname,
      request.nextUrl.search,
    );
    const loginUrl = new URL(loginTarget, request.url);

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/admin/:path*"],
};
