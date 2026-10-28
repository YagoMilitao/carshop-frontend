import { LuArrowRight } from "react-icons/lu"
import { PageSection } from "@/components/layout/page-section"
import { ContactAnchorLink } from "@/components/contact/contact-anchor-link"
import type { ServiceCategory } from "../_lib/group-works-by-category"

/**
 * Pilares da tagline publicada no Hero ("Upholstery · Restoration · Custom
 * Work", CARSHOP-144), aprovados pelo usuário como títulos editoriais da
 * seção em CARSHOP-167 — sem descrições (não há copy aprovada).
 */
export const SERVICE_PILLARS = ["Upholstery", "Restoration", "Custom Work"] as const

/** Máximo de categorias reais exibidas como evidência na Home. */
export const HOME_SERVICE_CATEGORIES_LIMIT = 6

type HomeServicesProps = {
  categories: readonly Pick<ServiceCategory, "key" | "label">[]
}

/**
 * `#services` (CARSHOP-167): sempre presente. As categorias reais de
 * `GET /works` são apenas evidência e somem sem dados ou em falha.
 *
 * Ordem do DOM = leitura no mobile (heading → pilares → evidência → CTA).
 * No `lg` o CTA é posicionado explicitamente na coluna esquerda, abaixo do
 * heading (sem CSS `order`); `grid-rows-[auto_1fr]` evita que a altura da
 * coluna direita afaste o CTA do heading.
 */
export function HomeServices({ categories }: Readonly<HomeServicesProps>) {
  const visibleCategories = categories.slice(0, HOME_SERVICE_CATEGORIES_LIMIT)

  return (
    <PageSection
      spacing="standard"
      id="services"
      aria-labelledby="services-heading"
      className="border-t border-border"
    >
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:grid-rows-[auto_1fr] lg:gap-x-8 lg:gap-y-6">
        <h2
          id="services-heading"
          className="text-heading-2 text-foreground lg:col-span-4 lg:col-start-1 lg:row-start-1"
        >
          Services
        </h2>

        <div className="flex flex-col gap-10 lg:col-span-8 lg:col-start-5 lg:row-span-2 lg:row-start-1">
          <ol className="flex flex-col divide-y divide-border border-t border-border">
            {SERVICE_PILLARS.map((pillar, index) => (
              <li
                key={pillar}
                className="flex items-baseline gap-6 py-6 lg:gap-10 lg:py-8"
              >
                <span aria-hidden="true" className="text-label tabular-nums text-muted-foreground">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="text-heading-3 text-foreground">{pillar}</span>
              </li>
            ))}
          </ol>

          {visibleCategories.length > 0 && (
            <div className="flex flex-col gap-3">
              <p
                id="services-categories-label"
                className="text-label text-muted-foreground"
              >
                Project categories
              </p>
              <ul
                aria-labelledby="services-categories-label"
                className="flex flex-wrap items-baseline gap-x-3 gap-y-1"
              >
                {visibleCategories.map((category, index) => (
                  <li
                    key={category.key}
                    className="flex items-baseline gap-x-3 text-body text-secondary-foreground"
                  >
                    {index > 0 && (
                      <span aria-hidden="true" className="text-muted-foreground">
                        ·
                      </span>
                    )}
                    {category.label}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <ContactAnchorLink
          className="inline-flex min-h-11 w-fit items-center gap-2 self-start rounded-lg text-nav text-foreground outline-hidden hover:text-primary focus-visible:ring-3 focus-visible:ring-focus-ring lg:col-span-4 lg:col-start-1 lg:row-start-2"
        >
          Contact CarShop
          <LuArrowRight aria-hidden="true" className="size-4 shrink-0" />
        </ContactAnchorLink>
      </div>
    </PageSection>
  )
}
