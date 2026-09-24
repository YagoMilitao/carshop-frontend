import { cn } from "@/lib/utils"
import {
  ProjectPreview,
  type ProjectPreviewFrame,
} from "../../_components/project-preview"
import type { PortfolioEntry, PortfolioRole } from "../_lib/build-portfolio-layout"

type RoleConfig = {
  frame: ProjectPreviewFrame
  sizes: string
  span: string
  lead: boolean
}

const roleConfig: Record<PortfolioRole, RoleConfig> = {
  lead: {
    frame: "banner",
    sizes:
      "(min-width: 1280px) 1120px, (min-width: 1024px) calc(100vw - 128px), 100vw",
    span: "md:col-span-2 lg:col-span-12",
    lead: true,
  },
  wide: {
    frame: "editorial",
    sizes:
      "(min-width: 1280px) 640px, (min-width: 1024px) 55vw, (min-width: 768px) 50vw, 100vw",
    span: "lg:col-span-7",
    lead: false,
  },
  narrow: {
    frame: "detail",
    sizes:
      "(min-width: 1280px) 450px, (min-width: 1024px) 40vw, (min-width: 768px) 50vw, 100vw",
    span: "lg:col-span-5",
    lead: false,
  },
  solo: {
    frame: "editorial",
    sizes: "(min-width: 1280px) 704px, (min-width: 1024px) 66vw, 100vw",
    span: "md:col-span-2 lg:col-span-8",
    lead: false,
  },
}

/** Grid editorial: a ordem no DOM é a ordem da API (sem CSS `order`). */
const PORTFOLIO_GRID_CLASSES =
  "grid grid-cols-1 items-start gap-y-12 md:grid-cols-2 md:gap-x-6 md:gap-y-16 lg:grid-cols-12 lg:gap-x-8 lg:gap-y-24"

type PortfolioGridProps = {
  entries: readonly PortfolioEntry[]
}

export function PortfolioGrid({ entries }: Readonly<PortfolioGridProps>) {
  return (
    <ul className={PORTFOLIO_GRID_CLASSES}>
      {entries.map(({ item, role }) => {
        const config = roleConfig[role]

        return (
          <li key={item.work.id} className={cn(config.span)}>
            <ProjectPreview
              item={item}
              sizes={config.sizes}
              frame={config.frame}
              headingLevel={2}
              lead={config.lead}
              priority={role === "lead"}
            />
          </li>
        )
      })}
    </ul>
  )
}
