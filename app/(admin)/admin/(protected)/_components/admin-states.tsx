import type { ReactNode } from "react";
import { LuCircleAlert } from "react-icons/lu";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Estados compartilhados das telas admin (CARSHOP-148): loading, erro e
 * vazio com o mesmo padrão visual em todas as listagens/formulários.
 * Apresentacionais e sem `"use client"` — o `onRetry` só é passado por
 * Client Components (que chamam o `refetch` da própria query GET).
 */

type AdminLoadingStateProps = Readonly<{
  /** Texto anunciado a tecnologias assistivas (mantido no DOM). */
  label: string;
  rows?: number;
}>;

export function AdminLoadingState({ label, rows = 3 }: AdminLoadingStateProps) {
  return (
    <output className="flex flex-col gap-3">
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton
          key={index}
          aria-hidden="true"
          className="h-16 w-full rounded-lg motion-reduce:animate-none"
        />
      ))}
    </output>
  );
}

type AdminErrorStateProps = Readonly<{
  message: string;
  onRetry?: () => void;
  isRetrying?: boolean;
}>;

export function AdminErrorState({
  message,
  onRetry,
  isRetrying = false,
}: AdminErrorStateProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-destructive/40 bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-2">
        <LuCircleAlert
          aria-hidden="true"
          className="mt-0.5 size-4 shrink-0 text-destructive-text"
        />
        <p role="alert" className="text-body-sm text-destructive-text">
          {message}
        </p>
      </div>
      {onRetry && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isRetrying}
          onClick={onRetry}
          className="self-start sm:self-auto"
        >
          {isRetrying ? "Tentando novamente..." : "Tentar novamente"}
        </Button>
      )}
    </div>
  );
}

type AdminEmptyStateProps = Readonly<{
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}>;

export function AdminEmptyState({
  title,
  description,
  action,
}: AdminEmptyStateProps) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed border-border-strong p-6">
      <div className="flex flex-col gap-1">
        <p className="text-body-sm font-semibold text-foreground">{title}</p>
        {description && (
          <p className="text-body-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
