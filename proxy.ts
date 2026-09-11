import { NextResponse, type NextRequest } from "next/server";

/**
 * Camada 1 de proteção das rotas `/admin/*` (defesa em profundidade,
 * complementar à camada 2 em `app/(admin)/admin/layout.tsx`). Checagem
 * barata: apenas a existência do cookie `refresh_token` — **não** chama o
 * backend aqui (isso é responsabilidade de `auth.server#getSession()` no
 * layout, que valida a sessão de fato).
 */
export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/admin/login") {
    return NextResponse.next();
  }

  const hasRefreshToken = request.cookies.has("refresh_token");

  if (!hasRefreshToken) {
    const loginUrl = new URL("/admin/login", request.url);

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
