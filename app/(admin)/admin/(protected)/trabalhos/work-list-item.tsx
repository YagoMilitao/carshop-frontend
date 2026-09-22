"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import {
  adminWorksQueryKey,
  deleteWork,
} from "@/lib/api/works.client";
import { deleteWorkImage, uploadWorkImage } from "@/lib/api/images.client";
import { getApiErrorMessage } from "@/lib/api/auth.client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Work } from "@/lib/api/works";

import { revalidateWorksTag } from "../../actions";
import { DeleteWorkDialog } from "./_components/delete-work-dialog";
import { WorkImageUpload } from "./_components/work-image-upload";

export function WorkListItem({ work }: Readonly<{ work: Work }>) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeletePending, setIsDeletePending] = useState(false);

  // Rejeita em caso de erro (após registrar a mensagem em `error`) para que
  // chamadores que precisem diferenciar sucesso de falha (ex.:
  // `WorkImageUpload`, que só limpa o preview em caso de sucesso) possam
  // reagir à rejeição. Chamadores que não precisam dessa distinção (ex.
  // `onDeleteImage`) descartam a rejeição explicitamente.
  const runMutation = async (mutation: () => Promise<void>) => {
    setError(null);
    setIsPending(true);

    try {
      await mutation();
      await Promise.allSettled([
        queryClient.invalidateQueries({ queryKey: adminWorksQueryKey }),
        revalidateWorksTag(),
      ]);
      router.refresh();
    } catch (mutationError) {
      setError(getApiErrorMessage(mutationError));
      throw mutationError;
    } finally {
      setIsPending(false);
    }
  };

  const onConfirmDeleteWork = () => {
    setDeleteError(null);
    setIsDeletePending(true);

    void (async () => {
      try {
        await deleteWork(work.id);
        await Promise.allSettled([
          queryClient.invalidateQueries({ queryKey: adminWorksQueryKey }),
          revalidateWorksTag(),
        ]);
        setIsDeleteDialogOpen(false);
        router.refresh();
      } catch (mutationError) {
        setDeleteError(getApiErrorMessage(mutationError));
      } finally {
        setIsDeletePending(false);
      }
    })();
  };

  const onDeleteImage = (imageId: string) => {
    // O erro já é exibido via estado `error`; a rejeição de `runMutation`
    // não precisa ser tratada aqui (não há um fluxo de "sucesso" adicional
    // a executar como em `onConfirmUploadImage`).
    runMutation(() => deleteWorkImage(work.id, imageId)).catch(() => {});
  };

  // Propaga a rejeição de `runMutation` para `WorkImageUpload`: em caso de
  // erro, o preview/input não são limpos (permitindo tentar de novo), e a
  // mensagem já foi definida em `error` por `runMutation`.
  const onConfirmUploadImage = (file: File) =>
    runMutation(async () => {
      await uploadWorkImage(work.id, file);
    });

  return (
    <li>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>{work.title}</CardTitle>
              <Badge variant="secondary" className="mt-1">
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
                type="button"
                variant="destructive"
                disabled={isPending}
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                Excluir work
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          <ul className="flex flex-wrap gap-2">
            {work.images.map((image) => (
              <li key={image.id} className="flex flex-col items-start gap-1">
                <span className="text-body-sm text-muted-foreground">
                  {image.alt || image.id}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isPending}
                  onClick={() => onDeleteImage(image.id)}
                >
                  Remover imagem
                </Button>
              </li>
            ))}
          </ul>

          <WorkImageUpload
            disabled={isPending}
            onConfirm={onConfirmUploadImage}
          />

          {error && (
            <p role="alert" className="text-body-sm text-destructive-text">
              {error}
            </p>
          )}
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
      />
    </li>
  );
}
