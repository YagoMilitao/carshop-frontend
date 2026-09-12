"use client";

import { useRef, useState } from "react";
import type { WorkImage } from "@/lib/api/works";
import { WorkImageThumb } from "./work-image-thumb";
import { GalleryLightbox } from "./gallery-lightbox";

type WorkGalleryProps = {
  images: WorkImage[];
  /** Usado como fallback de `alt` (ex.: título do work). */
  fallbackAlt: string;
};

const GRID_SIZES = "(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw";

/**
 * Grid responsivo de imagens de um `Work` com lightbox integrado. Mantém
 * o estado local de qual imagem está selecionada (`null` = lightbox
 * fechado) — único ponto interativo desta feature.
 */
export function WorkGallery({
  images,
  fallbackAlt,
}: Readonly<WorkGalleryProps>) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const lastTriggerRef = useRef<HTMLButtonElement | null>(null);

  if (images.length === 0) {
    return null;
  }

  const sortedImages = [...images].sort((a, b) => a.order - b.order);

  return (
    <div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {sortedImages.map((image, index) => (
          <li key={image.id}>
            <button
              type="button"
              onClick={(event) => {
                lastTriggerRef.current = event.currentTarget;
                setSelectedIndex(index);
              }}
              aria-label={`Ampliar imagem ${index + 1} de ${sortedImages.length}`}
              className="block w-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50 rounded-lg"
            >
              <WorkImageThumb
                image={image}
                fallbackAlt={fallbackAlt}
                sizes={GRID_SIZES}
              />
            </button>
          </li>
        ))}
      </ul>

      <GalleryLightbox
        images={sortedImages}
        selectedIndex={selectedIndex}
        onOpenChange={(open) => {
          if (!open) setSelectedIndex(null);
        }}
        onNavigate={setSelectedIndex}
        fallbackAlt={fallbackAlt}
        restoreFocusRef={lastTriggerRef}
      />
    </div>
  );
}
