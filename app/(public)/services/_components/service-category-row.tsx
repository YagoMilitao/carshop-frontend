import Link from "next/link"
import { LuArrowRight } from "react-icons/lu"
import { WorkImageThumb } from "@/components/gallery/work-image-thumb"
import { cn } from "@/lib/utils"
import {
  SERVICE_PROJECT_LINKS_LIMIT,
  type ServiceCategory,
} from "../_lib/group-works-by-category"

type ServiceCategoryRowProps = {
  category: ServiceCategory
  /** Posição zero-based na lista; exibida como "01", "02"... */
  index: number
  /** Somente a primeira linha da página deve receber `preload` (LCP). */
  preload?: boolean
}

const linkClassName =
  "inline-flex min-h-11 w-fit items-center gap-2 rounded-lg outline-hidden transition-colors hover:text-primary focus-visible:ring-3 focus-visible:ring-focus-ring"

function formatProjectCount(count: number): string {
  return count === 1 ? "1 project" : `${count} projects`
}

/**
 * Linha editorial de uma categoria real de trabalho (CARSHOP-147).
 *
 * A ordem do DOM é a ordem de leitura do mobile (número + nome → foto →
 * projetos). No `lg` cada bloco é posicionado explicitamente no grid de 12
 * colunas (sem CSS `order`): a foto ocupa as 6 colunas da direita cobrindo
 * as duas linhas; `grid-rows-[auto_1fr]` impede que a altura da foto
 * empurre a lista de projetos para baixo. A foto não é interativa.
 */
export function ServiceCategoryRow({
  category,
  index,
  preload = false,
}: Readonly<ServiceCategoryRowProps>) {
  const { label, works, preview } = category
  const headingId = `service-category-${index + 1}`
  const visibleWorks = works.slice(0, SERVICE_PROJECT_LINKS_LIMIT)
  const hasMore = works.length > SERVICE_PROJECT_LINKS_LIMIT
  const number = String(index + 1).padStart(2, "0")
  const textColumn = preview ? "lg:col-span-5" : "lg:col-span-11"

  return (
    <article
      aria-labelledby={headingId}
      className="grid grid-cols-1 gap-6 py-10 lg:grid-cols-12 lg:grid-rows-[auto_1fr] lg:gap-x-8 lg:py-16"
    >
      <div className="flex items-baseline gap-4 lg:contents">
        <span
          aria-hidden="true"
          className="text-label text-muted-foreground lg:col-span-1 lg:row-start-1 lg:pt-2"
        >
          {number}
        </span>
        <div
          className={cn(
            "flex flex-col gap-2 lg:col-start-2 lg:row-start-1",
            textColumn,
          )}
        >
          <h2 id={headingId} className="text-heading-3 text-foreground">
            {label}
          </h2>
          <p className="text-body-sm text-muted-foreground">
            {formatProjectCount(works.length)}
          </p>
        </div>
      </div>

      {preview && (
        <WorkImageThumb
          image={preview.image}
          fallbackAlt={preview.work.title}
          sizes="(min-width: 1280px) 560px, (min-width: 1024px) 50vw, 100vw"
          preload={preload}
          className="aspect-4/3 lg:col-span-6 lg:col-start-7 lg:row-span-2 lg:row-start-1"
        />
      )}

      <div
        className={cn(
          "flex flex-col gap-1 lg:col-start-2 lg:row-start-2",
          textColumn,
        )}
      >
        <ul className="flex flex-col">
          {visibleWorks.map((work) => (
            <li key={work.id}>
              <Link
                href={`/portfolio/${work.slug}`}
                className={cn(linkClassName, "text-body text-foreground")}
              >
                {work.title}
              </Link>
            </li>
          ))}
        </ul>
        {hasMore && (
          <Link
            href="/portfolio"
            className={cn(
              linkClassName,
              "text-body font-semibold text-foreground",
            )}
          >
            View all projects
            <LuArrowRight aria-hidden="true" className="size-4 shrink-0" />
          </Link>
        )}
      </div>
    </article>
  )
}
