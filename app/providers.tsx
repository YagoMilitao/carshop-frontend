"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

/**
 * Ponto único de composição de providers client-side. QueryClient é
 * criado via useState (não em módulo top-level) para evitar
 * compartilhar estado entre requisições/usuários no SSR do Next.
 */
export function Providers({ children }: Readonly<{ children: ReactNode }>) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
