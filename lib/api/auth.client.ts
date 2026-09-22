import { AxiosError } from "axios";

import {
  parseSessionResponse,
  type Session,
  type User,
} from "@/lib/api/auth";
import { http } from "@/lib/api/http";

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

type AuthResponse = {
  accessToken: string;
  csrfToken: string;
  sessionId: string;
  tokenType: "Bearer";
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
  const response = await http.post<AuthResponse>("/auth/login", payload);

  return {
    accessToken: response.data.accessToken,
    user: {
      id: response.data.sessionId,
      email: payload.email,
    },
  };
}

/**
 * `POST /auth/refresh`. Usado tanto pelo interceptor 401 de `http.ts`
 * quanto pelo bootstrap de sessão do `AuthProvider`.
 */
export async function refresh(): Promise<AuthResponse> {
  const response = await http.post<AuthResponse>("/auth/refresh");

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
  const response = await http.get<unknown>("/auth/session");
  const session = parseSessionResponse(response.data);

  if (!session) {
    throw new Error("Resposta inválida de GET /auth/session");
  }

  return session;
}
