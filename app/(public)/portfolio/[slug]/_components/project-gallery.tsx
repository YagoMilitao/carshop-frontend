"use client"

import { useRef, useState } from "react"
import { cn } from "@/lib/utils"
import type { WorkImage } from "@/lib/api/works"
import { GalleryLightbox } from "@/components/gallery/gallery-lightbox"
import { WorkImageThumb } from "@/components/gallery/work-image-thumb"
import type {
  ProjectGalleryLayout,
  ProjectGalleryRole,
} from "../_lib/build-project-gallery"

type FrameConfig = {
  frame: string
  span: string
  sizes: string
}

const HERO_CONFIG: FrameConfig = {
  frame: "aspect-4/3 md:aspect-video",
  span: "",
  sizes:
    "(min-width: 1280px) 1120px, (min-width: 1024px) calc(100vw - 128px), (min-width: 640px) calc(100vw - 64px), 100vw",
}

const ROLE_CONFIG: Record<ProjectGalleryRole, FrameConfig> = {
  wide: {
    frame: "aspect-4/3",
    span: "lg:col-span-7",
    sizes:
      "(min-width: 1280px) 640px, (min-width: 1024px) 58vw, (min-width: 768px) 50vw, 100vw",
  },
  narrow: {
    frame: "aspect-4/3 lg:aspect-3/4",
    span: "lg:col-span-5",
    sizes:
      "(min-width: 1280px) 448px, (min-width: 1024px) 42vw, (min-width: 768px) 50vw, 100vw",
  },
  solo: {
    frame: "aspect-4/3",
    span: "md:col-span-2 lg:col-span-8",
    sizes: "(min-width: 1280px) 736px, (min-width: 1024px) 66vw, 100vw",
  },
}

/** Ordem do DOM = ordem visual (sem CSS `order`). */
const SEQUENCE_GRID_CLASSES =
  "grid grid-cols-1 items-start gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-12 lg:gap-8"

type ProjectGalleryProps = {
  layout: ProjectGalleryLayout
  /** Usado quando `image.alt` vem vazio do backend (título do work). */
  fallbackAlt: string
}

/**
 * Galeria editorial do detalhe do projeto: hero dominante seguido de uma
 * sequência wide/narrow alternada. Único estado local é a imagem aberta
 * no lightbox (`null` = fechado) e o botão que a abriu, para devolver o
 * foco ao fechar.
 */
export function ProjectGallery({
  layout,
  fallbackAlt,
}: Readonly<ProjectGalleryProps>) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const lastTriggerRef = useRef<HTMLButtonElement | null>(null)

  const { hero, entries, viewerImages } = layout

  if (!hero) {
    return null
  }

  const total = viewerImages.length

  const renderTrigger = (
    image: WorkImage,
    viewerIndex: number,
    config: FrameConfig,
    preload: boolean,
  ) => {
    const alt = image.alt || fallbackAlt

    return (
      <button
        type="button"
        onClick={(event) => {
          lastTriggerRef.current = event.currentTarget
          setSelectedIndex(viewerIndex)
        }}
        aria-label={`View image ${viewerIndex + 1} of ${total}: ${alt}`}
        className="group block w-full cursor-zoom-in rounded-lg outline-hidden focus-visible:ring-3 focus-visible:ring-focus-ring"
      >
        <div className="overflow-hidden rounded-lg">
          <WorkImageThumb
            image={image}
            fallbackAlt={fallbackAlt}
            sizes={config.sizes}
            preload={preload}
            className={cn(
              "transition-transform duration-300 motion-safe:group-hover:scale-[1.02] motion-reduce:transition-none",
              config.frame,
            )}
          />
        </div>
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6 lg:gap-8">
      <div>{renderTrigger(hero, 0, HERO_CONFIG, true)}</div>

      {entries.length > 0 && (
        <ul className={SEQUENCE_GRID_CLASSES}>
          {entries.map(({ image, role, viewerIndex }) => {
            const config = ROLE_CONFIG[role]

            return (
              <li key={image.id} className={cn(config.span)}>
                {renderTrigger(image, viewerIndex, config, false)}
              </li>
            )
          })}
        </ul>
      )}

      <GalleryLightbox
        images={viewerImages}
        selectedIndex={selectedIndex}
        onOpenChange={(open) => {
          if (!open) setSelectedIndex(null)
        }}
        onNavigate={setSelectedIndex}
        fallbackAlt={fallbackAlt}
        restoreFocusRef={lastTriggerRef}
      />
    </div>
  )
}
