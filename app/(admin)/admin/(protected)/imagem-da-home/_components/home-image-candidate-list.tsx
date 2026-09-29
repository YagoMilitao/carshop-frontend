import Link from "next/link";

import { Button } from "@/components/ui/button";

import {
  AdminEmptyState,
  AdminErrorState,
  AdminLoadingState,
} from "../../_components/admin-states";

import {
  isSameHomeImageRef,
  type HomeImageCandidateGroup,
  type HomeImageRef,
} from "./home-image-candidates";
import { HomeImageCandidateOption } from "./home-image-candidate-option";

type HomeImageCandidateListProps = Readonly<{
  headingId: string;
  /** Um único `name` para todos os radios do formulário. */
  name: string;
  groups: readonly HomeImageCandidateGroup[] | undefined;
  isPending: boolean;
  isFetching: boolean;
  errorMessage: string | null;
  onRetry: () => void;
  checkedRef: HomeImageRef | null;
  activeRef: HomeImageRef | null;
  disabled: boolean;
  onSelect: (ref: HomeImageRef) => void;
}>;

/**
 * Apresentacional (sem `"use client"`): seção "Imagens disponíveis", um
 * `<fieldset>` por work (na ordem da API) com as imagens em grid.
 */
export function HomeImageCandidateList({
  headingId,
  name,
  groups,
  isPending,
  isFetching,
  errorMessage,
  onRetry,
  checkedRef,
  activeRef,
  disabled,
  onSelect,
}: HomeImageCandidateListProps) {
  const totalImages = groups?.reduce(
    (total, group) => total + group.images.length,
    0,
  );

  return (
    <section
      aria-labelledby={headingId}
      aria-busy={isFetching}
      className="flex flex-col gap-4"
    >
      <h2
        id={headingId}
        className="text-body-lg font-semibold text-foreground"
      >
        Imagens disponíveis
        {totalImages !== undefined ? ` (${totalImages})` : null}
      </h2>

      {isPending && (
        <AdminLoadingState label="Carregando imagens disponíveis..." />
      )}

      {errorMessage && (
        <AdminErrorState
          message={errorMessage}
          onRetry={onRetry}
          isRetrying={isFetching}
        />
      )}

      {groups?.length === 0 && (
        <AdminEmptyState
          title="Nenhuma imagem elegível"
          description="Publique um trabalho com imagens para poder usá-lo na Home."
          action={
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/trabalhos">Ir para Trabalhos</Link>
            </Button>
          }
        />
      )}

      {groups && groups.length > 0 && (
        <fieldset disabled={disabled} className="flex min-w-0 flex-col gap-8">
          {groups.map((group) => (
            <fieldset key={group.workId} className="flex min-w-0 flex-col gap-3">
              <legend className="mb-3 text-body font-semibold text-foreground">
                {group.workTitle}
              </legend>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {group.images.map((image, index) => {
                  const ref = { workId: group.workId, imageId: image.id };

                  return (
                    <HomeImageCandidateOption
                      key={image.id}
                      name={name}
                      workId={group.workId}
                      workTitle={group.workTitle}
                      image={image}
                      index={index}
                      isChecked={isSameHomeImageRef(checkedRef, ref)}
                      isActive={isSameHomeImageRef(activeRef, ref)}
                      onSelect={onSelect}
                    />
                  );
                })}
              </div>
            </fieldset>
          ))}
        </fieldset>
      )}
    </section>
  );
}
