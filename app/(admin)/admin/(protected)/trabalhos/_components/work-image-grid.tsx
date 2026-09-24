import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WorkImageThumb } from "@/components/gallery/work-image-thumb";
import type { WorkImage } from "@/lib/api/works";

type WorkImageGridProps = Readonly<{
  images: WorkImage[];
  workTitle: string;
  disabled: boolean;
  /**
   * Recebe também o botão acionado: o diálogo de confirmação é controlado
   * (sem `AlertDialogTrigger`), então quem o controla precisa devolver o
   * foco a esse botão manualmente ao cancelar.
   */
  onRequestRemove: (image: WorkImage, trigger: HTMLButtonElement) => void;
}>;

/** Descrição da imagem: `alt` do backend ou um fallback descritivo. */
export function getWorkImageLabel(
  image: WorkImage,
  index: number,
  workTitle: string,
): string {
  return image.alt || `Imagem ${index + 1} do trabalho ${workTitle}`;
}

/**
 * Identifica sem ambiguidade a ocorrência usada em ações. A posição é
 * mantida mesmo quando existe `alt`, pois imagens diferentes podem ter a
 * mesma descrição.
 */
export function getWorkImageActionLabel(
  image: WorkImage,
  index: number,
  workTitle: string,
): string {
  const position = index + 1;

  return image.alt
    ? `imagem ${position}: ${image.alt}`
    : `imagem ${position} do trabalho ${workTitle}`;
}

export function sortWorkImages(images: readonly WorkImage[]): WorkImage[] {
  return [...images].sort((a, b) => a.order - b.order);
}

// Componente de apresentação, sem estado: a confirmação e a remoção ficam
// com `WorkListItem`.
export function WorkImageGrid({
  images,
  workTitle,
  disabled,
  onRequestRemove,
}: WorkImageGridProps) {
  if (images.length === 0) {
    return (
      <p className="text-body-sm text-muted-foreground">
        Nenhuma imagem cadastrada para este trabalho.
      </p>
    );
  }

  const sortedImages = sortWorkImages(images);

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {sortedImages.map((image, index) => {
        const imageLabel = getWorkImageLabel(image, index, workTitle);
        const actionLabel = getWorkImageActionLabel(image, index, workTitle);

        return (
          <li key={image.id} className="flex flex-col gap-2">
            <WorkImageThumb
              image={image}
              fallbackAlt={imageLabel}
              sizes="(min-width: 1024px) 200px, (min-width: 640px) 33vw, 50vw"
            />
            <div className="flex items-center gap-2">
              {image.isCover && <Badge variant="secondary">Capa</Badge>}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="ml-auto"
                disabled={disabled}
                aria-label={`Remover ${actionLabel}`}
                onClick={(event) => onRequestRemove(image, event.currentTarget)}
              >
                Remover
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
