import { PageSection } from "@/components/layout/page-section"
import { isAllowedRemoteImageUrl } from "../_lib/is-allowed-remote-image-url"
import type {
  HomeHeroContent,
  HomeWork,
} from "../_lib/select-home-works"
import { HomeCtaActions } from "./home-cta-actions"
import {
  HomeHeroLayout,
  type HeroMediaCandidate,
} from "./home-hero-layout"

type HomeHeroProps = {
  hero: HomeHeroContent | null
  featured?: readonly HomeWork[]
}

/**
 * Converte os dados de domínio em candidatos estreitos e serializáveis para a
 * ilha Client. A ordem é estável: imagem principal e depois capas de featured.
 */
function createMediaCandidates(
  hero: HomeHeroContent | null,
  featured: readonly HomeWork[],
): HeroMediaCandidate[] {
  if (!hero) return []

  const sources: readonly HomeHeroContent[] = [hero, ...featured]
  const seenUrls = new Set<string>()
  const candidates: HeroMediaCandidate[] = []

  for (const source of sources) {
    if (
      seenUrls.has(source.image.url) ||
      !isAllowedRemoteImageUrl(source.image.url)
    ) {
      continue
    }

    seenUrls.add(source.image.url)
    candidates.push({
      image: {
        url: source.image.url,
        alt: source.image.alt || source.work?.title || "",
      },
      caption: source.work
        ? {
            category: source.work.category,
            title: source.work.title,
            href: `/portfolio/${source.work.slug}`,
          }
        : null,
    })
  }

  return candidates
}

export function HomeHero({
  hero,
  featured = [],
}: Readonly<HomeHeroProps>) {
  const candidates = createMediaCandidates(hero, featured)
  const candidatesKey = candidates
    .map((candidate) => candidate.image.url)
    .join("\n")

  return (
    <PageSection spacing="compact" aria-labelledby="home-hero-heading">
      <HomeHeroLayout key={candidatesKey} candidates={candidates}>
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
      </HomeHeroLayout>
    </PageSection>
  )
}
