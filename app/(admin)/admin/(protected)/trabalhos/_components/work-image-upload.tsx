"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
} from "react";

import {
  ACCEPTED_IMAGE_MIME_TYPES,
  MAX_IMAGE_SIZE_BYTES,
} from "@/lib/api/images.client";
import { Button } from "@/components/ui/button";

type WorkImageUploadProps = Readonly<{
  disabled: boolean;
  onConfirm: (file: File) => Promise<void>;
}>;

function formatBytes(bytes: number): string {
  return `${Math.round(bytes / (1024 * 1024))}MB`;
}

// Componente de apresentação/interação: não conhece Axios/mutação
// diretamente. A chamada real a `uploadWorkImage` é responsabilidade de
// quem controla `onConfirm` (`WorkListItem`), seguindo o mesmo padrão de
// `DeleteWorkDialog`. Fluxo: seleção → validação client-side → preview →
// confirmação explícita ("Enviar imagem") ou "Cancelar".
export function WorkImageUpload({ disabled, onConfirm }: WorkImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const addButtonRef = useRef<HTMLButtonElement | null>(null);
  const shouldRestoreFocusRef = useRef(false);
  const validationErrorId = useId();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const isInteractionDisabled = disabled || isUploading;

  // Revoga a URL de preview anterior sempre que ela muda ou o componente
  // desmonta — `URL.createObjectURL` mantém o blob vivo até
  // `revokeObjectURL`, então precisamos liberar explicitamente para não
  // vazar memória ao trocar de arquivo ou sair da tela.
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const clearPreview = () => {
    setPreviewUrl(null);
  };

  const resetSelection = () => {
    setSelectedFile(null);
    clearPreview();
    setValidationError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    shouldRestoreFocusRef.current = true;
  };

  useEffect(() => {
    if (
      !shouldRestoreFocusRef.current ||
      selectedFile ||
      previewUrl ||
      isInteractionDisabled
    ) {
      return;
    }

    shouldRestoreFocusRef.current = false;
    addButtonRef.current?.focus();
  }, [isInteractionDisabled, previewUrl, selectedFile]);

  const onSelectFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (
      !ACCEPTED_IMAGE_MIME_TYPES.includes(
        file.type as (typeof ACCEPTED_IMAGE_MIME_TYPES)[number],
      )
    ) {
      setSelectedFile(null);
      clearPreview();
      setValidationError(
        "Formato de imagem inválido (aceita JPEG, PNG ou WebP).",
      );
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setSelectedFile(null);
      clearPreview();
      setValidationError(
        `Imagem excede o limite de ${formatBytes(MAX_IMAGE_SIZE_BYTES)}.`,
      );
      return;
    }

    setValidationError(null);
    setSelectedFile(file);
    const nextPreviewUrl = URL.createObjectURL(file);
    setPreviewUrl(nextPreviewUrl);
  };

  const onSend = () => {
    if (!selectedFile || isInteractionDisabled) {
      return;
    }

    setIsUploading(true);

    // Em sucesso, limpa preview/input. Em erro, mantém a seleção (permite
    // tentar novamente) — o feedback de erro é responsabilidade do
    // componente pai, que controla `onConfirm` e a prop `disabled`.
    onConfirm(selectedFile).then(
      () => {
        resetSelection();
        setIsUploading(false);
      },
      () => setIsUploading(false),
    );
  };

  const onCancel = () => {
    resetSelection();
  };

  return (
    <div className="flex flex-col gap-2">
      {/* O input nativo fica oculto: o navegador renderiza "Escolher
          arquivo"/"Nenhum arquivo escolhido" junto dele, o que parecia três
          controles para a mesma ação. O botão visível abre o seletor e o
          texto ao lado mostra o estado da seleção. O input sai da ordem de
          tabulação e da árvore de acessibilidade para não duplicar o
          controle; foco e descrição de erro ficam no botão. */}
      <input
        ref={fileInputRef}
        type="file"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        aria-label="Adicionar imagem"
        accept={ACCEPTED_IMAGE_MIME_TYPES.join(",")}
        disabled={isInteractionDisabled}
        onChange={onSelectFile}
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button
          ref={addButtonRef}
          type="button"
          variant="outline"
          size="sm"
          disabled={isInteractionDisabled}
          aria-describedby={validationError ? validationErrorId : undefined}
          onClick={() => fileInputRef.current?.click()}
        >
          Adicionar imagem
        </Button>
        <p className="text-body-sm text-muted-foreground">
          {selectedFile ? selectedFile.name : "Nenhum arquivo escolhido"}
        </p>
      </div>

      {validationError && (
        <p
          id={validationErrorId}
          role="alert"
          className="text-body-sm text-destructive-text"
        >
          {validationError}
        </p>
      )}

      {previewUrl && selectedFile && (
        <div className="flex flex-col items-start gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- preview
              de um `blob:` local antes do envio; `next/image` não otimiza
              nem é necessário para uma pré-visualização temporária em
              memória. */}
          <img
            src={previewUrl}
            alt={`Pré-visualização de ${selectedFile.name}`}
            className="h-24 w-24 rounded object-cover"
          />
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              disabled={isInteractionDisabled}
              onClick={onSend}
            >
              {isUploading ? "Enviando..." : "Enviar imagem"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isInteractionDisabled}
              onClick={onCancel}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
