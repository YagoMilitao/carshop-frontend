"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";

import { deleteWork } from "@/lib/api/works.client";
import {
  ACCEPTED_IMAGE_MIME_TYPES,
  MAX_IMAGE_SIZE_BYTES,
  deleteWorkImage,
  uploadWorkImage,
} from "@/lib/api/images.client";
import { getApiErrorMessage } from "@/lib/api/auth.client";
import { Button } from "@/components/ui/button";
import type { Work } from "@/lib/api/works";

import { revalidateWorksTag } from "../actions";

function formatBytes(bytes: number): string {
  return `${Math.round(bytes / (1024 * 1024))}MB`;
}

export function WorkListItem({ work }: Readonly<{ work: Work }>) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const runMutation = async (mutation: () => Promise<void>) => {
    setError(null);
    setIsPending(true);

    try {
      await mutation();
      await revalidateWorksTag();
      router.refresh();
    } catch (mutationError) {
      setError(getApiErrorMessage(mutationError));
    } finally {
      setIsPending(false);
    }
  };

  const onDeleteWork = () => {
    void runMutation(() => deleteWork(work.id));
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
    <li className="flex flex-col gap-3 rounded-lg border border-border p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-medium">{work.title}</p>
          <p className="text-sm text-muted-foreground">{work.status}</p>
        </div>
        <Button
          type="button"
          variant="destructive"
          disabled={isPending}
          onClick={onDeleteWork}
        >
          Excluir work
        </Button>
      </div>

      <ul className="flex flex-wrap gap-2">
        {work.images.map((image) => (
          <li key={image.id} className="flex flex-col items-start gap-1">
            <span className="text-xs text-muted-foreground">
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

      <label className="flex flex-col gap-1.5 text-sm">
        Adicionar imagem
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_IMAGE_MIME_TYPES.join(",")}
          disabled={isPending}
          onChange={onUploadImage}
        />
      </label>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </li>
  );
}
