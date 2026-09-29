import type { Ref } from "react";
import Image from "next/image";

import type { HomeImage } from "@/lib/api/home-image";

import {
  AdminEmptyState,
  AdminErrorState,
  AdminLoadingState,
} from "../../_components/admin-states";

type CurrentHomeImageProps = Readonly<{
  headingId: string;
  headingRef: Ref<HTMLHeadingElement>;
  /** `undefined` enquanto não carregou; `null` quando nada está definido. */
  image: HomeImage | null | undefined;
  /** Título do work (das candidatas); ausente → exibe o `workId`. */
  workTitle: string | undefined;
  isPending: boolean;
  errorMessage: string | null;
  isRetrying: boolean;
  onRetry: () => void;
}>;

/**
 * Apresentacional (sem `"use client"`): seção "Imagem atual". O `h2` é
 * focável (`tabIndex={-1}`) para receber o foco após salvar.
 */
export function CurrentHomeImage({
  headingId,
  headingRef,
  image,
  workTitle,
  isPending,
  errorMessage,
  isRetrying,
  onRetry,
}: CurrentHomeImageProps) {
  const title = workTitle ?? image?.workId;

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-4">
      <h2
        id={headingId}
        ref={headingRef}
        tabIndex={-1}
        className="text-body-lg font-semibold text-foreground outline-hidden focus-visible:ring-3 focus-visible:ring-focus-ring"
      >
        Imagem atual
      </h2>

      {isPending && (
        <AdminLoadingState label="Carregando imagem atual..." rows={1} />
      )}

      {errorMessage && (
        <AdminErrorState
          message={errorMessage}
          onRetry={onRetry}
          isRetrying={isRetrying}
        />
      )}

      {image === null && (
        <AdminEmptyState
          title="Nenhuma imagem da Home definida"
          description="Nenhuma imagem foi escolhida ou a imagem escolhida deixou de estar disponível (trabalho despublicado ou removido). Escolha uma imagem abaixo."
        />
      )}

      {image && (
        <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
          <div className="relative aspect-video overflow-hidden rounded-lg bg-muted lg:col-span-2">
            <Image
              src={image.url}
              alt={image.alt || `Imagem atual da Home do trabalho ${title}`}
              fill
              sizes="(min-width: 1024px) 640px, 100vw"
              className="object-cover"
            />
          </div>
          <dl className="flex flex-col gap-3 text-body-sm">
            <div className="flex flex-col gap-0.5">
              <dt className="text-muted-foreground">Trabalho</dt>
              <dd className="break-words text-foreground">{title}</dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="text-muted-foreground">Texto alternativo</dt>
              <dd
                className={
                  image.alt
                    ? "break-words text-foreground"
                    : "text-muted-foreground italic"
                }
              >
                {image.alt || "Sem texto alternativo"}
              </dd>
            </div>
          </dl>
        </div>
      )}
    </section>
  );
}
