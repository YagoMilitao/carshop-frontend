import { NextResponse, type NextRequest } from "next/server";

import { serverEnv } from "@/lib/env/server";
import {
  REDIRECT_PATHNAME_HEADER,
  REDIRECT_SEARCH_HEADER,
  buildLoginUrlWithRedirect,
} from "@/lib/auth/redirect";

/**
 * Header interno (não exposto ao navegador) usado para repassar o access
 * token recém-mintado ao render do Server Component seguinte
 * (`lib/api/auth.server#getSession()`). Nunca deve ser copiado para
 * `response.headers` da resposta real enviada ao cliente.
 */
const ACCESS_TOKEN_HEADER = "x-carshop-access-token";

/**
 * Camada 1 de proteção das rotas `/admin/*` (defesa em profundidade,
 * complementar à camada 2 em `app/(admin)/admin/(protected)/layout.tsx`).
 *
 * Responsabilidades:
 * - Propaga o pathname/search reais da request (nunca confiando em headers
 *   vindos do client) via `REDIRECT_PATHNAME_HEADER`/`REDIRECT_SEARCH_HEADER`,
 *   incondicionalmente e antes de qualquer `return`, para que
 *   `(protected)/layout.tsx` consiga montar o `?redirect=` mesmo sem receber
 *   `searchParams` nativamente.
 * - Mint do access token (CARSHOP-152 fix): o backend (`GET /auth/session`)
 *   só aceita `Authorization: Bearer <accessToken>` — nunca cookie — e o
 *   `access_token` só existe em memória no navegador, então um Server
 *   Component nunca teve como enviá-lo. `proxy.ts` é a única camada do
 *   pipeline Next que roda antes do render e pode legitimamente setar
 *   `Set-Cookie` de resposta, então é aqui que o access token é mintado
 *   (via `POST /auth/refresh`, usando o cookie HttpOnly `refresh_token`) e
 *   repassado internamente para o render via `ACCESS_TOKEN_HEADER`.
 *   `getSession()` não chama `/auth/refresh` — só lê esse header interno.
 */
export async function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(REDIRECT_PATHNAME_HEADER, request.nextUrl.pathname);
  requestHeaders.set(REDIRECT_SEARCH_HEADER, request.nextUrl.search);

  if (request.nextUrl.pathname === "/admin/login") {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const refreshToken = request.cookies.get("refresh_token")?.value;

  if (!refreshToken) {
    const loginTarget = buildLoginUrlWithRedirect(
      request.nextUrl.pathname,
      request.nextUrl.search,
    );

    return NextResponse.redirect(new URL(loginTarget, request.url));
  }

  const csrfToken = request.cookies.get("csrf_token")?.value;

  let refreshResponse: Response;
  try {
    refreshResponse = await fetch(`${serverEnv.apiUrl}/auth/refresh`, {
      method: "POST",
      headers: {
        Cookie: request.headers.get("cookie") ?? "",
        ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
      },
      cache: "no-store",
    });
  } catch {
    const loginTarget = buildLoginUrlWithRedirect(
      request.nextUrl.pathname,
      request.nextUrl.search,
    );

    return NextResponse.redirect(new URL(loginTarget, request.url));
  }

  if (!refreshResponse.ok) {
    const loginTarget = buildLoginUrlWithRedirect(
      request.nextUrl.pathname,
      request.nextUrl.search,
    );
    const redirectResponse = NextResponse.redirect(
      new URL(loginTarget, request.url),
    );
    redirectResponse.cookies.delete("refresh_token");
    redirectResponse.cookies.delete("csrf_token");
    return redirectResponse;
  }

  const { accessToken } = (await refreshResponse.json()) as {
    accessToken: string;
  };

  const forwardedHeaders = new Headers(requestHeaders);
  forwardedHeaders.set(ACCESS_TOKEN_HEADER, accessToken);

  const response = NextResponse.next({
    request: { headers: forwardedHeaders },
  });

  // Repassa a rotação de refresh_token/csrf_token para o navegador — sem
  // isso o cookie do navegador fica dessincronizado do sessionStore (o
  // backend já rotacionou refreshTokenHash/csrfToken internamente).
  // `Headers` padrão às vezes concatena múltiplos `Set-Cookie` recebidos em
  // uma única string separada por vírgula (via `.get()`), o que quebraria
  // a rotação — por isso preferimos `getSetCookie()` (suportado tanto pelo
  // runtime Edge do Next quanto pelo `fetch` nativo do Node, verificado em
  // ambos), com fallback defensivo para `.get()` caso a implementação de
  // `fetch` em uso não a exponha.
  const setCookieHeaders =
    typeof refreshResponse.headers.getSetCookie === "function"
      ? refreshResponse.headers.getSetCookie()
      : (() => {
          const rawSetCookie = refreshResponse.headers.get("set-cookie");
          return rawSetCookie ? [rawSetCookie] : [];
        })();

  for (const setCookie of setCookieHeaders) {
    response.headers.append("set-cookie", setCookie);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
