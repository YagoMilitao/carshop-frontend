import { LuCheck } from "react-icons/lu";

import { Badge } from "@/components/ui/badge";
import { WorkImageThumb } from "@/components/gallery/work-image-thumb";
import type { WorkImage } from "@/lib/api/works";

import {
  getWorkImageActionLabel,
  getWorkImageLabel,
} from "../../trabalhos/_components/work-image-grid";

import type { HomeImageRef } from "./home-image-candidates";

type HomeImageCandidateOptionProps = Readonly<{
  name: string;
  workId: string;
  workTitle: string;
  image: WorkImage;
  index: number;
  isChecked: boolean;
  isActive: boolean;
  onSelect: (ref: HomeImageRef) => void;
}>;

/**
 * Apresentacional (sem `"use client"`): uma opção de imagem como radio
 * nativo. O `<input>` é o `peer` visualmente oculto; moldura, check e
 * foco reagem a ele via `peer-*`. O nome acessível vem do `aria-label` do
 * input, então o conteúdo visual é `aria-hidden` para não ser lido duas
 * vezes.
 */
export function HomeImageCandidateOption({
  name,
  workId,
  workTitle,
  image,
  index,
  isChecked,
  isActive,
  onSelect,
}: HomeImageCandidateOptionProps) {
  const imageLabel = getWorkImageLabel(image, index, workTitle);
  const actionLabel = getWorkImageActionLabel(image, index, workTitle);
  const accessibleName = isActive
    ? `${actionLabel} (imagem atual da Home)`
    : actionLabel;

  return (
    <label className="relative block cursor-pointer has-disabled:cursor-not-allowed">
      <input
        type="radio"
        name={name}
        value={`${workId}/${image.id}`}
        checked={isChecked}
        onChange={() => onSelect({ workId, imageId: image.id })}
        aria-label={accessibleName}
        // Mantém a opção focada acima da barra "sticky" de salvar ao navegar
        // por teclado.
        className="peer sr-only scroll-mb-40"
      />
      <div
        aria-hidden="true"
        className="rounded-lg border-2 border-input p-0.5 transition-colors hover:border-muted-foreground motion-reduce:transition-none peer-checked:border-primary peer-focus-visible:ring-3 peer-focus-visible:ring-focus-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background peer-disabled:opacity-60"
      >
        <WorkImageThumb
          image={image}
          fallbackAlt={imageLabel}
          sizes="(min-width: 1024px) 240px, (min-width: 640px) 33vw, 50vw"
          className="aspect-video rounded-md"
        />
      </div>
      {isActive && (
        <Badge aria-hidden="true" className="absolute top-2 left-2">
          Na Home
        </Badge>
      )}
      <span
        aria-hidden="true"
        className="absolute top-2 right-2 hidden size-6 items-center justify-center rounded-full bg-primary text-primary-foreground peer-checked:flex"
      >
        <LuCheck className="size-4" />
      </span>
    </label>
  );
}
