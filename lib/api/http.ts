import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

import { clientEnv } from "@/lib/env/client";

/**
 * Instância única do Axios para chamadas HTTP client-side (ADR-001):
 * nenhuma feature deve instanciar Axios diretamente ou usar `fetch` para
 * o mesmo propósito no cliente. Server Components/fetching server-side
 * usam `fetch` nativo do Next, fora deste módulo.
 */
export const http = axios.create({
  baseURL: clientEnv.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

/**
 * `accessToken` vive apenas em memória (module-level), nunca em
 * `localStorage`/`sessionStorage` (ver docs/rules/auth.md). É perdido em
 * reload de página por design — o bootstrap de sessão (`AuthProvider`)
 * é responsável por restaurá-lo via `GET /auth/session`.
 */
let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

/**
 * Callback registrado pelo `AuthProvider` para reagir a uma falha
 * definitiva de autenticação (refresh também falhou): limpar sessão local
 * e redirecionar para `/admin/login`. Mantido fora do React state para
 * ser acessível pelo interceptor Axios, que não é um componente.
 */
let authFailureCallback: (() => void) | null = null;

export function onAuthFailure(callback: () => void): void {
  authFailureCallback = callback;
}

const MUTATING_METHODS = new Set(["post", "put", "patch", "delete"]);

const AUTH_ENDPOINTS_EXCLUDED_FROM_RETRY = ["/auth/login", "/auth/refresh"];

/**
 * Lê o cookie `csrf_token` via `document.cookie` (client-only — este
 * interceptor nunca roda em SSR, pois `document` não existe nesse
 * contexto).
 */
function readCsrfTokenCookie(): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const match = /(?:^|;\s*)csrf_token=([^;]+)/.exec(document.cookie);

  return match ? decodeURIComponent(match[1]) : null;
}

http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();

  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }

  const method = config.method?.toLowerCase();

  if (method && MUTATING_METHODS.has(method)) {
    const csrfToken = readCsrfTokenCookie();

    if (csrfToken) {
      config.headers.set("X-CSRF-Token", csrfToken);
    }
  }

  return config;
});

function isExcludedFromRetry(url: string | undefined): boolean {
  if (!url) {
    return false;
  }

  return AUTH_ENDPOINTS_EXCLUDED_FROM_RETRY.some((path) =>
    url.includes(path),
  );
}

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

let refreshPromise: Promise<void> | null = null;

async function refreshAccessToken(): Promise<void> {
  // Módulo `auth.client.ts` depende de `http` (import cycle) — import
  // dinâmico evita o problema em runtime, mantendo o retry centralizado
  // aqui conforme o plano.
  const { refresh } = await import("./auth.client");
  const session = await refresh();

  setAccessToken(session.accessToken);
}

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      isExcludedFromRetry(originalRequest.url)
    ) {
      throw error;
    }

    originalRequest._retry = true;

    try {
      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null;
      });

      await refreshPromise;

      return http(originalRequest);
    } catch (refreshError) {
      setAccessToken(null);
      authFailureCallback?.();

      throw refreshError;
    }
  },
);
