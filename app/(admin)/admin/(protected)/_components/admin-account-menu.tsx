"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/lib/api/auth.client";
import { useAuth } from "@/lib/auth/AuthProvider";

/**
 * Client Component: exibe o e-mail do usuário autenticado e permite logout
 * (`useAuth().logout()`). Cobre lacuna funcional real — não havia botão de
 * logout em nenhum ponto do admin antes desta task (decisão do
 * `architect`, CARSHOP-152).
 */
export function AdminAccountMenu() {
  const { user, logout } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const onLogout = () => {
    setError(null);
    setIsPending(true);

    logout()
      .catch((logoutError: unknown) => {
        setError(getApiErrorMessage(logoutError));
      })
      .finally(() => {
        setIsPending(false);
      });
  };

  return (
    <div className="flex items-center gap-3">
      {user && (
        <span className="hidden text-body-sm text-muted-foreground sm:inline">
          {user.email}
        </span>
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={onLogout}
      >
        Sair
      </Button>
      {error && (
        <p role="alert" className="text-body-sm text-destructive-text">
          {error}
        </p>
      )}
    </div>
  );
}
