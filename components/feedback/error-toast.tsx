"use client";

import { useEffect } from "react";
import { toast } from "sonner";

type ErrorToastProps = {
  message: string;
};

/**
 * Dispara um toast de erro (`sonner`) no mount, sem renderizar UI própria.
 * Usado para falhas degradáveis (ex. comentários indisponíveis) que não
 * devem acionar o `error.tsx` de toda a rota.
 */
export function ErrorToast({ message }: Readonly<ErrorToastProps>) {
  useEffect(() => {
    toast.error(message);
  }, [message]);

  return null;
}
