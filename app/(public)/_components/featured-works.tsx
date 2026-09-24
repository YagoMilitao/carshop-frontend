import Link from "next/link"
import { LuArrowRight } from "react-icons/lu"
import { PageSection } from "@/components/layout/page-section"
import type { HomeWork } from "../_lib/select-home-works"
import { ProjectPreview } from "./project-preview"

const sizesByEmphasis = {
  dominant: "(min-width: 1280px) 750px, (min-width: 1024px) 66vw, 100vw",
  supporting:
    "(min-width: 1280px) 370px, (min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw",
} as const

type FeaturedWorksProps = {
  featured: HomeWork[]
}

/**
 * "Our Work": composição dominante + apoio (não grid uniforme). No `lg`, o
 * primeiro projeto ocupa 8 colunas e os demais empilham nas 4 restantes;
 * no `md`, o dominante ocupa a largura total e os de apoio ficam 2 a 2.
 */
export function FeaturedWorks({ featured }: Readonly<FeaturedWorksProps>) {
  const [dominant, ...supporting] = featured

  if (!dominant) {
    return null
  }

  return (
    <PageSection spacing="editorial" aria-labelledby="our-work-heading">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <h2 id="our-work-heading" className="text-heading-2 text-foreground">
          Our Work
        </h2>
        <Link
          href="/portfolio"
          className="inline-flex min-h-11 w-fit items-center gap-2 rounded-lg text-nav text-foreground outline-none hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          View all projects
          <LuArrowRight aria-hidden="true" className="size-4 shrink-0" />
        </Link>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:mt-14 lg:grid-cols-12 lg:gap-8">
        <div className="md:col-span-2 lg:col-span-8">
          <ProjectPreview item={dominant} sizes={sizesByEmphasis.dominant} />
        </div>
        {supporting.length > 0 && (
          <ul className="grid grid-cols-1 gap-4 md:col-span-2 md:grid-cols-2 lg:col-span-4 lg:grid-cols-1 lg:gap-8">
            {supporting.map((item) => (
              <li key={item.work.id}>
                <ProjectPreview item={item} sizes={sizesByEmphasis.supporting} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageSection>
  )
}
