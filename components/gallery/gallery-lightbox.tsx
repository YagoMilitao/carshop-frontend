"use client";

import type { KeyboardEvent, RefObject } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { VisuallyHidden } from "radix-ui";

import {
  Dialog,
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
 */
export function GalleryLightbox({
  images,
  selectedIndex,
  onOpenChange,
  onNavigate,
  fallbackAlt,
  restoreFocusRef,
}: Readonly<GalleryLightboxProps>) {
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
        className="flex max-w-3xl flex-col gap-4 bg-background/95 p-4 sm:max-w-3xl"
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
                {`Imagem ${selectedIndex + 1} de ${images.length}: ${
                  currentImage.alt || fallbackAlt
                }`}
              </DialogTitle>
            </VisuallyHidden.Root>

            <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-lg bg-muted">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={currentImage.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="relative size-full"
                >
                  <Image
                    src={currentImage.url}
                    alt={currentImage.alt || fallbackAlt}
                    fill
                    sizes="100vw"
                    className="object-contain"
                  />
                </motion.div>
              </AnimatePresence>

              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={goToPrevious}
                    aria-label="Imagem anterior"
                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 text-foreground shadow-md outline-none hover:bg-background focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <ChevronLeft className="size-5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={goToNext}
                    aria-label="Próxima imagem"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 text-foreground shadow-md outline-none hover:bg-background focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <ChevronRight className="size-5" aria-hidden="true" />
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
