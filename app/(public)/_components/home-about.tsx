import Link from "next/link"
import { LuArrowRight } from "react-icons/lu"
import { PageSection } from "@/components/layout/page-section"
import { WorkImageThumb } from "@/components/gallery/work-image-thumb"
import { cn } from "@/lib/utils"
import type { HomeWork } from "../_lib/select-home-works"

type HomeAboutDifferentiator = { title: string; description?: string }

export type HomeAboutContent = {
  heading: string
  narrative: string
  differentiators: readonly HomeAboutDifferentiator[]
}

/**
 * Copy aprovada pelo usuário em CARSHOP-169, usada literalmente (sem
 * paráfrase). Os diferenciais são apenas títulos: não há descrições
 * aprovadas. Vive só na Home; `/about` permanece inalterado.
 */
export const HOME_ABOUT_CONTENT = {
  heading: "Hello, we are DreamUP",
  narrative:
    "We take care of interior upholstery — your auto interior restoration dream is our reality.",
  differentiators: [
    { title: "Friendly as can be" },
    { title: "Fair pricing" },
    { title: "Quick turnaround" },
    { title: "High quality" },
  ],
} as const satisfies HomeAboutContent

type HomeAboutProps = {
  image: HomeWork | null
  /** Permite testar variações (ex.: diferenciais com descrição). */
  content?: HomeAboutContent
}

/**
 * `#about` (CARSHOP-169): sempre presente (copy estática); só a foto depende
 * de `GET /works` e some sem candidato ou em falha.
 *
 * Ordem do DOM = leitura no mobile (heading + narrativa → foto → lista). No
 * `lg`, texto e lista ficam na coluna esquerda e a foto ocupa a direita em
 * duas linhas; `grid-rows-[auto_1fr]` mantém a lista logo abaixo do texto.
 */
export function HomeAbout({
  image,
  content = HOME_ABOUT_CONTENT,
}: Readonly<HomeAboutProps>) {
  const hasImage = image !== null

  return (
    <PageSection
      spacing="standard"
      id="about"
      aria-labelledby="home-about-heading"
      className="border-t border-border"
    >
      <div
        className={cn(
          "grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-x-8 lg:gap-y-6",
          hasImage && "lg:grid-rows-[auto_1fr]",
        )}
      >
        <div
          className={cn(
            "flex flex-col gap-6 lg:col-span-5",
            hasImage && "lg:col-start-1 lg:row-start-1",
          )}
        >
          <h2 id="home-about-heading" className="text-heading-2 text-foreground">
            {content.heading}
          </h2>
          <p className="text-body-lg text-secondary-foreground">{content.narrative}</p>
        </div>

        {image && (
          <figure className="flex flex-col gap-3 lg:col-span-6 lg:col-start-7 lg:row-span-2 lg:row-start-1">
            <WorkImageThumb
              image={image.image}
              fallbackAlt={image.work.title}
              sizes="(min-width: 1280px) 544px, (min-width: 1024px) 50vw, 100vw"
              className="aspect-4/3 lg:aspect-4/5"
            />
            <figcaption className="flex flex-col gap-1">
              <span className="text-label text-muted-foreground">
                {image.work.category}
              </span>
              <Link
                href={`/portfolio/${image.work.slug}`}
                className="inline-flex min-h-11 w-fit items-center gap-2 rounded-lg text-nav text-foreground outline-hidden hover:text-primary focus-visible:ring-3 focus-visible:ring-focus-ring"
              >
                {image.work.title}
                <LuArrowRight aria-hidden="true" className="size-4 shrink-0" />
              </Link>
            </figcaption>
          </figure>
        )}

        <ul
          className={cn(
            "flex flex-col divide-y divide-border border-t border-border",
            hasImage
              ? "lg:col-span-5 lg:col-start-1 lg:row-start-2"
              : "lg:col-span-6 lg:col-start-7",
          )}
        >
          {content.differentiators.map((item) => (
            <li key={item.title} className="py-6 lg:py-8">
              <p className="text-heading-3 text-foreground">{item.title}</p>
              {item.description && (
                <p className="mt-2 text-body text-secondary-foreground">{item.description}</p>
              )}
            </li>
          ))}
        </ul>
      </div>
    </PageSection>
  )
}
