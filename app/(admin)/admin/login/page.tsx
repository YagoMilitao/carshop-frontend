"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { useAuth } from "@/lib/auth/AuthProvider";
import {
  DEFAULT_ADMIN_PATH,
  REDIRECT_QUERY_PARAM,
  isSafeInternalRedirectPath,
} from "@/lib/auth/redirect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Container } from "@/components/layout/container";

const loginSchema = z.object({
  email: z.string().min(1, "Informe o e-mail.").email("E-mail inválido."),
  password: z.string().min(1, "Informe a senha."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const INVALID_CREDENTIALS_MESSAGE = "E-mail ou senha inválidos.";

/**
 * Formulário de login admin propriamente dito. Extraído de
 * `AdminLoginPage` para isolar o uso de `useSearchParams()` (necessário
 * para ler `?redirect=`) sob um boundary de `<Suspense>`, evitando CSR
 * bailout da rota em produção.
 */
function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const searchParams = useSearchParams();

  const redirectParam = searchParams.get(REDIRECT_QUERY_PARAM);
  const redirectTarget = isSafeInternalRedirectPath(redirectParam)
    ? redirectParam
    : DEFAULT_ADMIN_PATH;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginFormValues) => {
    setFormError(null);

    try {
      await login(values);
      toast.success("Admin logado");
      router.push(redirectTarget);
    } catch {
      setFormError(INVALID_CREDENTIALS_MESSAGE);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center">
      <Container variant="reading" className="flex flex-col gap-6 py-16">
        <h1 className="text-heading-3 text-foreground">
          Entrar no painel admin
        </h1>

        <form
          className="flex flex-col gap-4"
          noValidate
          onSubmit={(event) => void handleSubmit(onSubmit)(event)}
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              aria-invalid={errors.email ? "true" : "false"}
              aria-describedby={errors.email ? "email-error" : undefined}
              {...register("email")}
            />
            {errors.email && (
              <p id="email-error" className="text-body-sm text-destructive-text">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              aria-invalid={errors.password ? "true" : "false"}
              aria-describedby={errors.password ? "password-error" : undefined}
              {...register("password")}
            />
            {errors.password && (
              <p id="password-error" className="text-body-sm text-destructive-text">
                {errors.password.message}
              </p>
            )}
          </div>

          {formError && (
            <p role="alert" className="text-body-sm text-destructive-text">
              {formError}
            </p>
          )}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </Container>
    </main>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
