import type { Metadata } from "next"
import { clientEnv } from "@/lib/env/client"
import { getHomeImage, type HomeImage } from "@/lib/api/home-image.server"
import { getWorks, type Work } from "@/lib/api/works"
import { selectHomeWorks } from "./_lib/select-home-works"
import { getHomeReviews } from "./_lib/get-home-reviews"
import { groupWorksByCategory } from "./_lib/group-works-by-category"
import { HomeHero } from "./_components/home-hero"
import { HomeServices } from "./_components/home-services"
import { FeaturedWorks } from "./_components/featured-works"
import { HomeReviews } from "./_components/home-reviews"
import { FinalCta } from "./_components/final-cta"

const description =
  "Automotive upholstery, restoration and custom interior work."

export const metadata: Metadata = {
  description,
  alternates: {
    canonical: new URL("/", clientEnv.NEXT_PUBLIC_SITE_URL).toString(),
  },
  openGraph: {
    title: "CarShop",
    description,
  },
}

export default async function HomePage() {
  const [worksResult, homeImageResult] = await Promise.allSettled([
    getWorks(),
    getHomeImage(),
  ])

  // Degradação silenciosa e independente: a Home continua útil sem a API
  // (Hero tipográfico + Final CTA) e, sem a imagem configurada, usa o
  // fallback de `selectHomeWorks` — sem toast nem mensagem de estado.
  let works: Work[] = []
  if (worksResult.status === "fulfilled") {
    works = worksResult.value
  } else {
    console.error("Falha ao buscar works na Home:", worksResult.reason)
  }

  let homeImage: HomeImage | null = null
  if (homeImageResult.status === "fulfilled") {
    homeImage = homeImageResult.value
  } else {
    console.error(
      "Falha ao buscar a imagem principal da Home:",
      homeImageResult.reason,
    )
  }

  const { hero, featured } = selectHomeWorks(works, homeImage)

  // Depende da listagem de works (fan-out limitado por work); nunca rejeita.
  // Sem dados ou em falha, `#reviews` é omitida (sem âncora).
  const reviews = await getHomeReviews(works)

  return (
    <>
      <HomeHero hero={hero} featured={featured} />
      <HomeServices categories={groupWorksByCategory(works)} />
      {featured.length >= 1 && <FeaturedWorks featured={featured} />}
      <HomeReviews reviews={reviews} />
      <FinalCta />
    </>
  )
}
