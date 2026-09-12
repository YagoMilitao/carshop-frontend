import Image from "next/image";
import { cn } from "cn";
import type { WorkImage } from "@/lib/api/works";

type WorkImageThumbProps = {
  image: WorkImage;
  /** Usado quando `image.alt` vem vazio do backend. */
  fallbackAlt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
};

/**
 * Wrapper puro de `next/image` para uma `WorkImage`: sem estado, sem
 * eventos — Server Component reaproveitado tanto pelo grid da galeria
 * quanto pela miniatura de capa da listagem de portfolio.
 */
export function WorkImageThumb({
  image,
  fallbackAlt,
  sizes,
  priority = false,
  className,
}: Readonly<WorkImageThumbProps>) {
  return (
    <div
      className={cn(
        "relative aspect-square overflow-hidden rounded-lg bg-muted",
        className,
      )}
    >
      <Image
        src={image.url}
        alt={image.alt || fallbackAlt}
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover"
      />
    </div>
  );
}
