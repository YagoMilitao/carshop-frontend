"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { HomeImage } from "@/lib/api/home-image";
import {
  getHomeImage,
  homeImageQueryKey,
  setHomeImage,
} from "@/lib/api/home-image.client";

import { CurrentHomeImage } from "./current-home-image";
import {
  findHomeImageCandidate,
  isSameHomeImageRef,
  type HomeImageRef,
} from "./home-image-candidates";
import { HomeImageCandidateList } from "./home-image-candidate-list";
import {
  getHomeImageErrorMessage,
  shouldRefreshHomeImageCandidates,
} from "./home-image-error";
import { HomeImageSaveBar } from "./home-image-save-bar";
import { useHomeImageCandidates } from "./use-home-image-candidates";

/**
 * Única fronteira client da página `/admin/imagem-da-home` (CARSHOP-160):
 * lê a imagem atual (`GET /home-image`) e as candidatas, e salva a nova
 * seleção (`PATCH /admin/home-image`) apenas com `{ workId, imageId }`.
 *
 * Ponto de extensão para CARSHOP-161 (revalidação da Home pública): o
 * `onSuccess` da mutação.
 */
export function HomeImageSettings() {
  const queryClient = useQueryClient();
  const currentHeadingId = useId();
  const candidatesHeadingId = useId();
  const radioName = useId();
  const currentHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const isSubmittingRef = useRef(false);

  const homeImageQuery = useQuery({
    queryKey: homeImageQueryKey,
    queryFn: getHomeImage,
  });
  const candidates = useHomeImageCandidates();

  const [pendingSelection, setPendingSelection] = useState<HomeImageRef | null>(
    null,
  );
  const [saveError, setSaveError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: setHomeImage,
    onSuccess: (image) => {
      queryClient.setQueryData<HomeImage | null>(homeImageQueryKey, image);
      setPendingSelection(null);
      toast.success("Imagem da Home atualizada.");
      currentHeadingRef.current?.focus();
    },
    onError: (error) => {
      setSaveError(getHomeImageErrorMessage(error));

      if (shouldRefreshHomeImageCandidates(error)) {
        void candidates.refetch();
        void homeImageQuery.refetch();
      }
    },
    onSettled: () => {
      isSubmittingRef.current = false;
    },
  });

  const activeImage = homeImageQuery.data;
  const activeRef: HomeImageRef | null = activeImage
    ? { workId: activeImage.workId, imageId: activeImage.imageId }
    : null;

  // Seleção derivada (sem `useEffect` de sincronização): se a candidata
  // escolhida sumiu da lista (ex.: após refetch em 404/409), vale como
  // "sem seleção".
  const selectedMatch = findHomeImageCandidate(
    candidates.groups,
    pendingSelection,
  );
  const selection = selectedMatch ? pendingSelection : null;
  const hasChange =
    selection !== null && !isSameHomeImageRef(selection, activeRef);
  const checkedRef = selection ?? activeRef;

  const summary =
    hasChange && selectedMatch
      ? `Selecionada: imagem ${selectedMatch.index + 1} do trabalho ${selectedMatch.group.workTitle}`
      : "Nenhuma alteração";

  const activeWorkTitle = activeImage
    ? candidates.groups?.find((group) => group.workId === activeImage.workId)
        ?.workTitle
    : undefined;

  const hasCandidates = (candidates.groups?.length ?? 0) > 0;

  const onSelect = (ref: HomeImageRef) => {
    setSaveError(null);
    setPendingSelection(ref);
  };

  const onUndo = () => {
    setSaveError(null);
    setPendingSelection(null);
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Guarda síncrona contra duplo envio antes do re-render com `isPending`.
    if (!hasChange || !selection || isSubmittingRef.current) {
      return;
    }

    isSubmittingRef.current = true;
    setSaveError(null);
    mutation.mutate({ workId: selection.workId, imageId: selection.imageId });
  };

  return (
    <div className="flex flex-col gap-10">
      <CurrentHomeImage
        headingId={currentHeadingId}
        headingRef={currentHeadingRef}
        image={activeImage}
        workTitle={activeWorkTitle}
        isPending={homeImageQuery.isPending}
        errorMessage={
          homeImageQuery.error
            ? "Não foi possível carregar a imagem atual da Home."
            : null
        }
        isRetrying={homeImageQuery.isFetching}
        onRetry={() => void homeImageQuery.refetch()}
      />

      <form onSubmit={onSubmit} className="flex flex-col gap-6">
        <HomeImageCandidateList
          headingId={candidatesHeadingId}
          name={radioName}
          groups={candidates.groups}
          isPending={candidates.isPending}
          isFetching={candidates.isFetching}
          errorMessage={
            candidates.error
              ? "Não foi possível carregar as imagens disponíveis."
              : null
          }
          onRetry={() => void candidates.refetch()}
          checkedRef={checkedRef}
          activeRef={activeRef}
          disabled={mutation.isPending}
          onSelect={onSelect}
        />

        {(hasCandidates || saveError) && (
          <HomeImageSaveBar
            summary={summary}
            errorMessage={saveError}
            hasChange={hasChange}
            isSaving={mutation.isPending}
            onUndo={onUndo}
          />
        )}
      </form>
    </div>
  );
}
