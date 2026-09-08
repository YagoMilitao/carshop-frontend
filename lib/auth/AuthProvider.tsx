"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

import {
  getSession,
  login as loginRequest,
  logout as logoutRequest,
  type LoginPayload,
} from "@/lib/api/auth.client";
import type { User } from "@/lib/api/auth.server";
import { onAuthFailure, setAccessToken } from "@/lib/api/http";

type AuthContextValue = {
  user: User | null;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Fonte da verdade de sessão no client: recebe `initialUser` do
 * `admin/layout.tsx` (populado por `auth.server#getSession()`,
 * autoritativo via cookie HttpOnly) e mantém `accessToken` em memória
 * (`lib/api/http.ts`), nunca em `localStorage`/`sessionStorage`.
 */
export function AuthProvider({
  initialUser,
  children,
}: Readonly<{ initialUser: User | null; children: ReactNode }>) {
  const [user, setUser] = useState<User | null>(initialUser);
  const router = useRouter();

  const login = useCallback(async (payload: LoginPayload) => {
    const session = await loginRequest(payload);

    setAccessToken(session.accessToken);
    setUser(session.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    onAuthFailure(() => {
      setAccessToken(null);
      setUser(null);
      router.push("/admin/login");
    });
  }, [router]);

  useEffect(() => {
    // Re-bootstrap ao montar no cliente: apenas sincroniza `user`, já que
    // `GET /auth/session` não minta `accessToken` (ver auth.client.ts).
    // Falha aqui não desloga o usuário — a sessão de origem
    // (`initialUser`) já foi validada pelo Server Component do layout.
    getSession()
      .then((session) => setUser(session.user))
      .catch(() => undefined);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated: user !== null, login, logout }),
    [user, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  }

  return context;
}
