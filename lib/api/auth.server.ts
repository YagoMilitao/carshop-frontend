import "server-only";

import { headers } from "next/headers";

import { parseSessionResponse, type Session } from "@/lib/api/auth";
import { serverEnv } from "@/lib/env/server";

export type { Session, User } from "@/lib/api/auth";

/**
 * Camada de acesso a dados de sessão (`GET /auth/session`) usada
 * exclusivamente por `app/(admin)/admin/(protected)/layout.tsx` (Server
 * Component).
 *
 * O backend só aceita `Authorization: Bearer <accessToken>` (nunca
 * cookie) em `GET /auth/session`. O access token é mintado em `proxy.ts`
 * (única camada do pipeline Next que roda antes do render e pode
 * legitimamente setar `Set-Cookie`/rotacionar `refresh_token` via
 * `POST /auth/refresh`) e repassado a este render via o header interno
 * `x-carshop-access-token` — nunca exposto ao navegador. `getSession()`
 * apenas lê esse header e valida a sessão junto ao backend; não chama
 * `/auth/refresh` (ver ADR/spec de CARSHOP-152).
 */

const ACCESS_TOKEN_HEADER = "x-carshop-access-token";

/**
 * Busca a sessão atual usando o access token já mintado por `proxy.ts` e
 * repassado via header interno. `cache: 'no-store'`: dado de sessão nunca
 * é cacheado pelo Next Data Cache. Retorna `null` em qualquer falha
 * (header ausente, sessão inválida/expirada, erro de rede) — o chamador
 * (`app/(admin)/admin/(protected)/layout.tsx`) interpreta `null` como
 * "não autenticado" e redireciona para `/admin/login`.
 */
export async function getSession(): Promise<Session | null> {
  const headerStore = await headers();
  const accessToken = headerStore.get(ACCESS_TOKEN_HEADER);

  if (!accessToken) {
    return null;
  }

  try {
    const response = await fetch(`${serverEnv.apiUrl}/auth/session`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const payload: unknown = await response.json();

    return parseSessionResponse(payload);
  } catch {
    return null;
  }
}
