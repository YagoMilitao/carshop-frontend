import { AxiosError } from "axios";

import { http } from "@/lib/api/http";
import type { Session, User } from "@/lib/api/auth.server";

/**
 * Camada de acesso a dados de autenticação client-side (Axios, via
 * instância única de `lib/api/http.ts` — ADR-001). `refresh()` também é
 * usado internamente pelo interceptor de resposta de `http.ts` (import
 * dinâmico lá, para evitar ciclo de import em tempo de carregamento do
 * módulo).
 */

export type LoginPayload = {
  email: string;
  password: string;
};

export type AuthSession = {
  accessToken: string;
  user: User;
};

/**
 * Formato de erro do contrato da API (backend `carshop-backend`).
 */
export type ApiErrorBody = {
  message: string;
  errors?: Record<string, string[]>;
};

export function getApiErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const body = error.response?.data as ApiErrorBody | undefined;

    if (body?.message) {
      return body.message;
    }
  }

  return "Ocorreu um erro inesperado. Tente novamente.";
}

/**
 * `POST /auth/login`. Apenas retorna os dados (token/usuário) — quem grava
 * o token via `setAccessToken()` é o chamador (`AuthProvider`/`LoginForm`),
 * não este módulo.
 */
export async function login(payload: LoginPayload): Promise<AuthSession> {
  const response = await http.post<AuthSession>("/auth/login", payload);

  return response.data;
}

/**
 * `POST /auth/refresh`. Usado tanto pelo interceptor 401 de `http.ts`
 * quanto pelo bootstrap de sessão do `AuthProvider`.
 */
export async function refresh(): Promise<AuthSession> {
  const response = await http.post<AuthSession>("/auth/refresh");

  return response.data;
}

/**
 * `POST /auth/logout`. Revoga a sessão no servidor (invalida
 * `refresh_token`/`csrf_token`).
 */
export async function logout(): Promise<void> {
  await http.post("/auth/logout");
}

/**
 * `GET /auth/session` (variante client, Axios) — usada pelo
 * `AuthProvider` para sincronizar `user` ao montar no cliente. Não emite
 * `accessToken` (esse dado só é mintado por `login`/`refresh`); a
 * restauração do token em memória após um reload de página é feita de
 * forma preguiçosa pelo interceptor 401 de `http.ts` na primeira chamada
 * autenticada, não aqui.
 */
export async function getSession(): Promise<Session> {
  const response = await http.get<Session>("/auth/session");

  return response.data;
}
