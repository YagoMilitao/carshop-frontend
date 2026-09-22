"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import {
  adminWorksQueryKey,
  deleteWork,
} from "@/lib/api/works.client";
import {
  ACCEPTED_IMAGE_MIME_TYPES,
  MAX_IMAGE_SIZE_BYTES,
  deleteWorkImage,
  uploadWorkImage,
} from "@/lib/api/images.client";
import { getApiErrorMessage } from "@/lib/api/auth.client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Work } from "@/lib/api/works";

import { revalidateWorksTag } from "../../actions";
import { DeleteWorkDialog } from "./_components/delete-work-dialog";

function formatBytes(bytes: number): string {
  return `${Math.round(bytes / (1024 * 1024))}MB`;
}

export function WorkListItem({ work }: Readonly<{ work: Work }>) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeletePending, setIsDeletePending] = useState(false);

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
    void runMutation(() => deleteWorkImage(work.id, imageId));
  };

  const onUploadImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (
      !ACCEPTED_IMAGE_MIME_TYPES.includes(
        file.type as (typeof ACCEPTED_IMAGE_MIME_TYPES)[number],
      )
    ) {
      setError("Formato de imagem inválido (aceita JPEG, PNG ou WebP).");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setError(
        `Imagem excede o limite de ${formatBytes(MAX_IMAGE_SIZE_BYTES)}.`,
      );
      return;
    }

    void runMutation(async () => {
      await uploadWorkImage(work.id, file);
    }).finally(() => {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    });
  };

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
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled
                aria-disabled="true"
                title="Disponível em breve"
              >
                Editar
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

          <label className="flex flex-col gap-1.5 text-body-sm">
            <span>Adicionar imagem</span>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_IMAGE_MIME_TYPES.join(",")}
              disabled={isPending}
              onChange={onUploadImage}
            />
          </label>

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
