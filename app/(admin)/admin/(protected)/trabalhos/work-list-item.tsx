"use client";

import { useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

import {
  adminWorksQueryKey,
  deleteWork,
} from "@/lib/api/works.client";
import { deleteWorkImage, uploadWorkImage } from "@/lib/api/images.client";
import { getApiErrorMessage } from "@/lib/api/auth.client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Work, WorkImage } from "@/lib/api/works";

import { revalidateWorksTag } from "../../actions";
import { DeleteWorkDialog } from "./_components/delete-work-dialog";
import { DeleteWorkImageDialog } from "./_components/delete-work-image-dialog";
import { getDeleteWorkImageErrorMessage } from "./_components/delete-work-image-error";
import {
  WorkImageGrid,
  getWorkImageLabel,
  sortWorkImages,
} from "./_components/work-image-grid";
import { WorkImageUpload } from "./_components/work-image-upload";

type ImageToRemove = Readonly<{
  image: WorkImage;
  label: string;
}>;

export function WorkListItem({ work }: Readonly<{ work: Work }>) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const imagesHeadingId = useId();
  const imagesHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const focusSectionOnCloseRef = useRef(false);
  const removeImageTriggerRef = useRef<HTMLButtonElement | null>(null);
  const deleteWorkButtonRef = useRef<HTMLButtonElement | null>(null);

  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploadPending, setIsUploadPending] = useState(false);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeletePending, setIsDeletePending] = useState(false);

  // Snapshot da imagem (e do label exibido) no momento em que o diálogo é
  // aberto: um refetch com o diálogo aberto (ex.: após 404) não altera o
  // texto de confirmação.
  const [imageToRemove, setImageToRemove] = useState<ImageToRemove | null>(
    null,
  );
  const [removeImageError, setRemoveImageError] = useState<string | null>(
    null,
  );
  const [isRemoveImagePending, setIsRemoveImagePending] = useState(false);
  // Após um 404 a imagem já não existe: não faz sentido tentar de novo.
  const [canConfirmRemoveImage, setCanConfirmRemoveImage] = useState(true);
  const [removeImageStatus, setRemoveImageStatus] = useState("");

  const isImageActionPending = isUploadPending || isRemoveImagePending;

  // Sincroniza cache do TanStack Query, tag do Next e RSC após uma mutação
  // bem-sucedida. Falhas aqui nunca são apresentadas como falha da ação.
  const syncWorks = async () => {
    await Promise.allSettled([
      queryClient.invalidateQueries({ queryKey: adminWorksQueryKey }),
      revalidateWorksTag(),
    ]);
    router.refresh();
  };

  const onConfirmDeleteWork = () => {
    setDeleteError(null);
    setIsDeletePending(true);

    void (async () => {
      try {
        await deleteWork(work.id);
        await syncWorks();
        setIsDeleteDialogOpen(false);
      } catch (mutationError) {
        setDeleteError(getApiErrorMessage(mutationError));
      } finally {
        setIsDeletePending(false);
      }
    })();
  };

  // Rejeita em caso de erro (após registrar a mensagem) para que
  // `WorkImageUpload` só limpe o preview em caso de sucesso.
  const onConfirmUploadImage = async (file: File) => {
    setUploadError(null);
    setIsUploadPending(true);

    try {
      await uploadWorkImage(work.id, file);
      await syncWorks();
    } catch (mutationError) {
      setUploadError(getApiErrorMessage(mutationError));
      throw mutationError;
    } finally {
      setIsUploadPending(false);
    }
  };

  const onRequestRemoveImage = (
    image: WorkImage,
    trigger: HTMLButtonElement,
  ) => {
    removeImageTriggerRef.current = trigger;
    const index = sortWorkImages(work.images).findIndex(
      (candidate) => candidate.id === image.id,
    );
    setRemoveImageError(null);
    setRemoveImageStatus("");
    setCanConfirmRemoveImage(true);
    focusSectionOnCloseRef.current = false;
    setImageToRemove({
      image,
      label: getWorkImageLabel(image, index, work.title),
    });
  };

  const onRemoveImageDialogOpenChange = (open: boolean) => {
    if (open) {
      return;
    }
    // Não permite fechar (Esc/Cancelar) com o DELETE em andamento.
    if (isRemoveImagePending) {
      return;
    }
    setImageToRemove(null);
    setRemoveImageError(null);
  };

  const onConfirmRemoveImage = () => {
    if (!imageToRemove) {
      return;
    }

    const { image } = imageToRemove;
    setRemoveImageError(null);
    setIsRemoveImagePending(true);

    void (async () => {
      try {
        await deleteWorkImage(work.id, image.id);
      } catch (mutationError) {
        // 401 já passou pelo interceptor de `lib/api/http.ts` (refresh e,
        // se falhar, `onAuthFailure`); aqui só exibimos o feedback.
        const isNotFound =
          mutationError instanceof AxiosError &&
          mutationError.response?.status === 404;

        if (isNotFound) {
          // A imagem (ou o work) já não existe: atualiza a lista para
          // tirá-la da tela, mantendo o diálogo aberto com a mensagem.
          focusSectionOnCloseRef.current = true;
          setCanConfirmRemoveImage(false);
          await syncWorks();
        }

        setRemoveImageError(getDeleteWorkImageErrorMessage(mutationError));
        setIsRemoveImagePending(false);
        return;
      }

      await syncWorks();
      focusSectionOnCloseRef.current = true;
      setRemoveImageStatus("Imagem removida.");
      setIsRemoveImagePending(false);
      setImageToRemove(null);
    })();
  };

  const onDeleteWorkDialogCloseAutoFocus = (event: Event) => {
    // Diálogo controlado, sem `AlertDialogTrigger`: o Radix mandaria o foco
    // para o `body`. No cancelar/Esc o foco volta a "Excluir work". Após
    // uma exclusão bem-sucedida este item é desmontado pelo refetch (junto
    // com o diálogo), então este handler normalmente nem roda; se o item
    // continuar montado (ex.: refetch falhou), o botão ainda existe e
    // recebe o foco.
    event.preventDefault();
    if (deleteWorkButtonRef.current?.isConnected) {
      deleteWorkButtonRef.current.focus();
    }
  };

  const onRemoveImageDialogCloseAutoFocus = (event: Event) => {
    // O diálogo é controlado e não usa `AlertDialogTrigger`, então o Radix
    // não sabe para onde devolver o foco (iria para o `body`). O foco é
    // gerenciado aqui:
    // - sucesso ou 404: o botão "Remover" pode não existir mais após o
    //   refetch, então o foco vai para o heading da seção;
    // - cancelar/Esc: volta ao botão "Remover" que abriu o diálogo (ou ao
    //   heading, se esse botão tiver saído do DOM).
    event.preventDefault();

    const trigger = removeImageTriggerRef.current;
    removeImageTriggerRef.current = null;

    if (!focusSectionOnCloseRef.current && trigger?.isConnected) {
      trigger.focus();
      return;
    }

    focusSectionOnCloseRef.current = false;
    imagesHeadingRef.current?.focus();
  };

  return (
    <li>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>{work.title}</CardTitle>
              <Badge
                variant={work.status === "published" ? "success" : "secondary"}
                className="mt-1"
              >
                {work.status}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" asChild>
                <Link href={`/admin/trabalhos/${work.slug}/editar`}>
                  Editar
                </Link>
              </Button>
              <Button
                ref={deleteWorkButtonRef}
                type="button"
                variant="destructive"
                disabled={isImageActionPending}
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                Excluir work
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <section
            aria-labelledby={imagesHeadingId}
            className="flex flex-col gap-4"
          >
            {/* h2: o título do work (`CardTitle`) é uma `div`, então o
                próximo nível abaixo do h1 da página é h2. */}
            <h2
              id={imagesHeadingId}
              ref={imagesHeadingRef}
              tabIndex={-1}
              className="text-body font-semibold text-foreground"
            >
              {/* O complemento sr-only diferencia o nome acessível entre os
                  vários cards da listagem. */}
              Imagens ({work.images.length}){" "}
              <span className="sr-only">do trabalho {work.title}</span>
            </h2>

            <WorkImageGrid
              images={work.images}
              workTitle={work.title}
              disabled={isImageActionPending}
              onRequestRemove={onRequestRemoveImage}
            />

            <WorkImageUpload
              disabled={isImageActionPending}
              onConfirm={onConfirmUploadImage}
            />

            {uploadError && (
              <p role="alert" className="text-body-sm text-destructive-text">
                {uploadError}
              </p>
            )}

            <output className="sr-only">
              {removeImageStatus}
            </output>
          </section>
        </CardContent>
      </Card>

      <DeleteWorkDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          setIsDeleteDialogOpen(open);
          if (!open) {
            setDeleteError(null);
          }
        }}
        workTitle={work.title}
        onConfirm={onConfirmDeleteWork}
        isPending={isDeletePending}
        error={deleteError}
        onCloseAutoFocus={onDeleteWorkDialogCloseAutoFocus}
      />

      <DeleteWorkImageDialog
        open={imageToRemove !== null}
        onOpenChange={onRemoveImageDialogOpenChange}
        imageLabel={imageToRemove?.label ?? ""}
        onConfirm={onConfirmRemoveImage}
        isPending={isRemoveImagePending}
        canConfirm={canConfirmRemoveImage}
        error={removeImageError}
        onCloseAutoFocus={onRemoveImageDialogCloseAutoFocus}
      />
    </li>
  );
}
