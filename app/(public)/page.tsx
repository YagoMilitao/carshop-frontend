import type { Metadata } from "next"
import { clientEnv } from "@/lib/env/client"
import { getWorks, type Work } from "@/lib/api/works"
import { selectHomeWorks } from "./_lib/select-home-works"
import { HomeHero } from "./_components/home-hero"
import { FeaturedWorks } from "./_components/featured-works"
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
  let works: Work[] = []

  try {
    works = await getWorks()
  } catch (error) {
    // Degradação silenciosa: a Home continua útil sem a API (Hero
    // tipográfico + Final CTA), sem toast nem mensagem de estado.
    console.error("Falha ao buscar works na Home:", error)
  }

  const { hero, featured } = selectHomeWorks(works)

  return (
    <>
      <HomeHero hero={hero} />
      {featured.length >= 1 && <FeaturedWorks featured={featured} />}
      <FinalCta />
    </>
  )
}
