import { Button } from "@/components/ui/button";

type HomeImageSaveBarProps = Readonly<{
  summary: string;
  errorMessage: string | null;
  hasChange: boolean;
  isSaving: boolean;
  onUndo: () => void;
}>;

/**
 * Apresentacional (sem `"use client"`): barra de salvar "sticky" dentro do
 * `<form>`. Por ocupar espaço no fluxo, nunca cobre o último item quando a
 * página está rolada até o fim.
 */
export function HomeImageSaveBar({
  summary,
  errorMessage,
  hasChange,
  isSaving,
  onUndo,
}: HomeImageSaveBarProps) {
  return (
    <div className="sticky bottom-0 z-10 flex flex-col gap-3 border-t border-border bg-background py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-col gap-1">
        <p aria-live="polite" className="text-body-sm text-muted-foreground">
          {summary}
        </p>
        {errorMessage && (
          <p role="alert" className="text-body-sm text-destructive-text">
            {errorMessage}
          </p>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {hasChange && (
          <Button
            type="button"
            variant="ghost"
            disabled={isSaving}
            onClick={onUndo}
          >
            Desfazer seleção
          </Button>
        )}
        <Button type="submit" disabled={!hasChange || isSaving}>
          {isSaving ? "Salvando..." : "Salvar imagem da Home"}
        </Button>
      </div>
    </div>
  );
}
