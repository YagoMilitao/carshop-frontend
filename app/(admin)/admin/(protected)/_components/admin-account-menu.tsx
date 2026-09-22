"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/lib/api/auth.client";
import { useAuth } from "@/lib/auth/AuthProvider";
import { LOGIN_PATH } from "@/lib/auth/redirect";

/**
 * Client Component: exibe o e-mail do usuário autenticado e permite logout
 * (`useAuth().logout()`). Cobre lacuna funcional real — não havia botão de
 * logout em nenhum ponto do admin antes desta task (decisão do
 * `architect`, CARSHOP-152).
 */
export function AdminAccountMenu() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const onLogout = async () => {
    setError(null);
    setIsPending(true);

    try {
      await logout();
      queryClient.removeQueries({ queryKey: ["admin"] });
      router.replace(LOGIN_PATH);
    } catch (logoutError) {
      setError(getApiErrorMessage(logoutError));
    } finally {
      setIsPending(false);
    }
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
        onClick={() => void onLogout()}
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
