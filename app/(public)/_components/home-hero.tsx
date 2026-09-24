import Link from "next/link"
import { LuArrowRight } from "react-icons/lu"
import { WorkImageThumb } from "@/components/gallery/work-image-thumb"
import { PageSection } from "@/components/layout/page-section"
import { cn } from "@/lib/utils"
import type { HomeWork } from "../_lib/select-home-works"
import { HomeCtaActions } from "./home-cta-actions"

type HomeHeroProps = {
  hero: HomeWork | null
}

export function HomeHero({ hero }: Readonly<HomeHeroProps>) {
  return (
    <PageSection spacing="compact" aria-labelledby="home-hero-heading">
      <div
        className={cn(
          "grid grid-cols-1 gap-10",
          hero && "lg:grid-cols-12 lg:items-center lg:gap-12",
        )}
      >
        <div
          className={cn(
            "flex flex-col gap-6",
            hero ? "lg:col-span-5" : "max-w-5xl",
          )}
        >
          <h1
            id="home-hero-heading"
            className="text-display-xl text-foreground"
          >
            Crafted for your car. Built for the road.
          </h1>
          <p className="text-body-lg text-secondary-foreground">
            Upholstery · Restoration · Custom Work
          </p>
          <div className="pt-2">
            <HomeCtaActions />
          </div>
        </div>

        {hero && (
          <figure className="flex flex-col gap-3 lg:col-span-7">
            {/* Único `priority` da página: imagem crítica acima da dobra. */}
            <WorkImageThumb
              image={hero.image}
              fallbackAlt={hero.work.title}
              sizes="(min-width: 1280px) 660px, (min-width: 1024px) 55vw, 100vw"
              priority
              className="aspect-4/3"
            />
            <figcaption className="flex flex-col gap-1">
              <span className="text-label text-muted-foreground">
                {hero.work.category}
              </span>
              <Link
                href={`/portfolio/${hero.work.slug}`}
                className="inline-flex min-h-11 w-fit items-center gap-2 rounded-lg text-body font-semibold text-foreground outline-none hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {hero.work.title}
                <LuArrowRight aria-hidden="true" className="size-4 shrink-0" />
              </Link>
            </figcaption>
          </figure>
        )}
      </div>
    </PageSection>
  )
}
