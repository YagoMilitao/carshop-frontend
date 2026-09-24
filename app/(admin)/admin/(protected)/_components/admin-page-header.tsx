import type { ReactNode } from "react";

type AdminPageHeaderProps = Readonly<{
  title: string;
  description?: string;
  /** Ações da página (ex.: CTA primário "Novo trabalho"). */
  actions?: ReactNode;
}>;

/**
 * Server Component: cabeçalho padrão das páginas protegidas do admin
 * (CARSHOP-148). Único `h1` da página; ações ficam à direita em `sm+` e
 * abaixo do título em telas estreitas.
 */
export function AdminPageHeader({
  title,
  description,
  actions,
}: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1">
        <h1 className="text-heading-3 text-foreground">{title}</h1>
        {description && (
          <p className="text-body text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
