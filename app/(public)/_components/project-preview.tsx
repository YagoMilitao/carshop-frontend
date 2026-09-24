import Link from "next/link"
import { WorkImageThumb } from "@/components/gallery/work-image-thumb"
import type { Work, WorkImage } from "@/lib/api/works"
import { cn } from "@/lib/utils"

/** Work já com a imagem resolvida pela camada de apresentação que o usa. */
export type ProjectPreviewItem = {
  work: Work
  image: WorkImage
}

/**
 * Proporções controladas por papel no layout (o contrato não expõe
 * dimensões nem focal point das imagens): `editorial` 4:3, `banner`
 * 4:3 → 16:9 a partir de `md`, `detail` 4:3 → 3:4 a partir de `lg`.
 */
export type ProjectPreviewFrame = "editorial" | "banner" | "detail"

type ProjectPreviewProps = {
  item: ProjectPreviewItem
  sizes: string
  frame?: ProjectPreviewFrame
  headingLevel?: 2 | 3
  lead?: boolean
  priority?: boolean
}

const frameClassNames: Record<ProjectPreviewFrame, string> = {
  editorial: "aspect-4/3",
  banner: "aspect-4/3 md:aspect-video",
  detail: "aspect-4/3 lg:aspect-3/4",
}

export function ProjectPreview({
  item,
  sizes,
  frame = "editorial",
  headingLevel = 3,
  lead = false,
  priority = false,
}: Readonly<ProjectPreviewProps>) {
  const { work, image } = item
  const Heading = headingLevel === 2 ? "h2" : "h3"

  const titleBlock = (
    <div className={cn("flex flex-col gap-1", lead && "lg:col-span-6")}>
      <span className="text-label text-muted-foreground">
        {work.category}
      </span>
      <Heading
        className={cn(
          lead ? "text-heading-2" : "text-heading-3",
          "text-foreground transition-colors group-hover:text-primary",
        )}
      >
        {work.title}
      </Heading>
    </div>
  )

  return (
    <Link
      href={`/portfolio/${work.slug}`}
      aria-label={work.title}
      className="group flex flex-col gap-4 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <div className="overflow-hidden rounded-lg">
        <WorkImageThumb
          image={image}
          fallbackAlt={work.title}
          sizes={sizes}
          priority={priority}
          className={cn(
            frameClassNames[frame],
            "transition-transform duration-300 motion-safe:group-hover:scale-[1.02] motion-reduce:transition-none",
          )}
        />
      </div>
      {lead ? (
        <div className="flex flex-col gap-3 lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-8">
          {titleBlock}
          {work.description && (
            <p className="line-clamp-3 text-body text-secondary-foreground lg:col-span-5 lg:col-start-8">
              {work.description}
            </p>
          )}
        </div>
      ) : (
        titleBlock
      )}
    </Link>
  )
}
