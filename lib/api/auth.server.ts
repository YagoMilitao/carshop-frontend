import "server-only";

import { cookies } from "next/headers";

import { serverEnv } from "@/lib/env/server";

/**
 * Camada de acesso a dados de sessão (`GET /auth/session`) usada
 * exclusivamente por `app/(admin)/admin/layout.tsx` (Server Component).
 * Usa `fetch` nativo do Next, repassando manualmente os cookies HttpOnly
 * da request recebida — Server Components não têm acesso ao `accessToken`
 * em memória do cliente (ver ADR/spec de CARSHOP-122).
 */

export type User = {
  id: string;
  email: string;
  name: string;
};

export type Session = {
  user: User;
};

/**
 * Busca a sessão atual repassando o header `Cookie` da request recebida.
 * `cache: 'no-store'`: dado de sessão nunca é cacheado pelo Next Data
 * Cache. Retorna `null` em qualquer falha (sessão ausente/expirada/erro de
 * rede) — o chamador (`admin/layout.tsx`) interpreta `null` como "não
 * autenticado" e redireciona para `/admin/login`.
 */
export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  try {
    const response = await fetch(`${serverEnv.apiUrl}/auth/session`, {
      headers: cookieHeader ? { Cookie: cookieHeader } : undefined,
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as Session;
  } catch {
    return null;
  }
}
