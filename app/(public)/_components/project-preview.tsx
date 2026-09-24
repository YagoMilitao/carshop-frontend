import Link from "next/link"
import { WorkImageThumb } from "@/components/gallery/work-image-thumb"
import type { HomeWork } from "../_lib/select-home-works"

type ProjectPreviewEmphasis = "dominant" | "supporting"

type ProjectPreviewProps = {
  item: HomeWork
  emphasis: ProjectPreviewEmphasis
}

const sizesByEmphasis: Record<ProjectPreviewEmphasis, string> = {
  dominant: "(min-width: 1280px) 750px, (min-width: 1024px) 66vw, 100vw",
  supporting:
    "(min-width: 1280px) 370px, (min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw",
}

export function ProjectPreview({
  item,
  emphasis,
}: Readonly<ProjectPreviewProps>) {
  const { work, image } = item

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
          sizes={sizesByEmphasis[emphasis]}
          className="aspect-4/3 transition-transform duration-300 motion-safe:group-hover:scale-[1.02] motion-reduce:transition-none"
        />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-label text-muted-foreground">
          {work.category}
        </span>
        <h3 className="text-heading-3 text-foreground transition-colors group-hover:text-primary">
          {work.title}
        </h3>
      </div>
    </Link>
  )
}
