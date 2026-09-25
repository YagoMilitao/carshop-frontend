import Link from "next/link"
import { LuArrowRight } from "react-icons/lu"
import type { Work } from "@/lib/api/works"

type PortfolioTextEntryProps = {
  work: Work
}

/** Entrada tipográfica para works sem nenhuma imagem — sem placeholder. */
export function PortfolioTextEntry({ work }: Readonly<PortfolioTextEntryProps>) {
  return (
    <Link
      href={`/portfolio/${work.slug}`}
      aria-label={work.title}
      className="group flex min-h-11 items-start gap-4 rounded-lg py-6 outline-hidden focus-visible:ring-3 focus-visible:ring-focus-ring lg:grid lg:grid-cols-12 lg:gap-x-8"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-2 lg:col-span-10 lg:grid lg:grid-cols-10 lg:gap-x-8">
        <span className="text-label text-muted-foreground lg:col-span-3 lg:pt-1">
          {work.category}
        </span>
        <div className="flex flex-col gap-2 lg:col-span-7">
          <h2 className="text-heading-3 text-foreground transition-colors group-hover:text-primary">
            {work.title}
          </h2>
          {work.description && (
            <p className="line-clamp-2 text-body text-secondary-foreground">
              {work.description}
            </p>
          )}
        </div>
      </div>
      <LuArrowRight
        aria-hidden="true"
        className="mt-1 size-5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary lg:col-span-2 lg:justify-self-end"
      />
    </Link>
  )
}
