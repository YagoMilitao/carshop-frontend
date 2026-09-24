import type { WorkStatus } from "@/lib/api/works";

type WorkStatusBadgeVariant = "success" | "secondary";

/**
 * Fonte única dos rótulos de status de work no admin (Badge da listagem e
 * `<option>`s do formulário) — nunca exibir o enum cru. Em inglês por
 * decisão do usuário (reafirmando CARSHOP-34, CARSHOP-148); status de
 * comentários seguem em pt-BR (`comentarios/_components/comment-status.ts`).
 */
export const workStatusLabels: Readonly<Record<WorkStatus, string>> = {
  published: "Published",
  draft: "Draft",
};

export const workStatusBadgeVariants: Readonly<
  Record<WorkStatus, WorkStatusBadgeVariant>
> = {
  published: "success",
  draft: "secondary",
};

/** Ordem das opções no formulário (rascunho primeiro, como antes). */
export const workStatusOptions: readonly WorkStatus[] = ["draft", "published"];
