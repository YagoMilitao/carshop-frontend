"use client";

import type { KeyboardEvent, RefObject } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { LuChevronLeft, LuChevronRight, LuX } from "react-icons/lu";
import { VisuallyHidden } from "radix-ui";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import type { WorkImage } from "@/lib/api/works";

type GalleryLightboxProps = {
  images: WorkImage[];
  selectedIndex: number | null;
  onOpenChange: (open: boolean) => void;
  onNavigate: (index: number) => void;
  fallbackAlt: string;
  /** Elemento (miniatura) que abriu o lightbox — recebe o foco de volta ao fechar. */
  restoreFocusRef: RefObject<HTMLElement | null>;
};

/**
 * Lightbox de imagens (Radix Dialog + Framer Motion). Só monta a
 * `next/image` da imagem selecionada quando o dialog está aberto — não
 * pré-carrega as demais. Navegação circular (avança do último para o
 * primeiro e vice-versa) via botões ou setas do teclado; `Esc`/focus trap
 * são cobertos nativamente pelo Radix Dialog. A devolução de foco à
 * miniatura que abriu o lightbox é explícita via `restoreFocusRef` (o
 * Dialog é controlado por botões externos ao Dialog root, sem
 * `DialogTrigger`, então não há um trigger implícito para o Radix
 * devolver o foco sozinho).
 *
 * Com `prefers-reduced-motion`, o fade do Framer Motion tem duração 0 e as
 * animações de entrada/saída do conteúdo e do overlay são desligadas.
 */
export function GalleryLightbox({
  images,
  selectedIndex,
  onOpenChange,
  onNavigate,
  fallbackAlt,
  restoreFocusRef,
}: Readonly<GalleryLightboxProps>) {
  const shouldReduceMotion = useReducedMotion();
  const isOpen = selectedIndex !== null;
  const currentImage =
    selectedIndex !== null ? images[selectedIndex] : undefined;

  const goToPrevious = () => {
    if (selectedIndex === null) return;
    onNavigate(selectedIndex === 0 ? images.length - 1 : selectedIndex - 1);
  };

  const goToNext = () => {
    if (selectedIndex === null) return;
    onNavigate(selectedIndex === images.length - 1 ? 0 : selectedIndex + 1);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goToPrevious();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      goToNext();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[calc(100dvh-2rem)] flex-col gap-4 overflow-y-auto bg-background/95 p-4 sm:max-w-5xl motion-reduce:data-open:animate-none motion-reduce:data-closed:animate-none"
        onKeyDown={handleKeyDown}
        onCloseAutoFocus={(event) => {
          if (restoreFocusRef.current) {
            event.preventDefault();
            restoreFocusRef.current.focus();
          }
        }}
      >
        {currentImage && selectedIndex !== null && (
          <>
            <VisuallyHidden.Root asChild>
              <DialogTitle>
                {`Image ${selectedIndex + 1} of ${images.length}: ${
                  currentImage.alt || fallbackAlt
                }`}
              </DialogTitle>
            </VisuallyHidden.Root>

            <DialogClose asChild>
              <button
                type="button"
                aria-label="Close"
                className="inline-flex size-11 items-center justify-center self-end rounded-full text-foreground outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <LuX className="size-5" aria-hidden="true" />
              </button>
            </DialogClose>

            <div className="relative flex aspect-3/4 max-h-[calc(100dvh-10rem)] w-full items-center justify-center overflow-hidden rounded-lg bg-muted sm:aspect-video">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={currentImage.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: shouldReduceMotion ? 0 : 0.15 }}
                  className="relative size-full"
                >
                  <Image
                    src={currentImage.url}
                    alt={currentImage.alt || fallbackAlt}
                    fill
                    sizes="(min-width: 1088px) 1024px, calc(100vw - 2rem)"
                    className="object-contain"
                  />
                </motion.div>
              </AnimatePresence>

              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={goToPrevious}
                    aria-label="Previous image"
                    className="absolute left-2 top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-foreground shadow-md outline-none hover:bg-background focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <LuChevronLeft className="size-5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={goToNext}
                    aria-label="Next image"
                    className="absolute right-2 top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-foreground shadow-md outline-none hover:bg-background focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <LuChevronRight className="size-5" aria-hidden="true" />
                  </button>
                </>
              )}
            </div>

            {images.length > 1 && (
              <p
                className="text-center text-sm text-muted-foreground"
                aria-live="polite"
                aria-atomic="true"
              >
                {selectedIndex + 1} / {images.length}
                <VisuallyHidden.Root asChild>
                  <span>{`: ${currentImage.alt || fallbackAlt}`}</span>
                </VisuallyHidden.Root>
              </p>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
