import type { Metadata } from 'next'
import Link from 'next/link'
import { LuArrowRight } from 'react-icons/lu'
import { clientEnv } from '@/lib/env/client'
import { getWorks, type Work } from '@/lib/api/works'
import { Container } from '@/components/layout/container'
import { PageSection } from '@/components/layout/page-section'
import { WorkImageThumb } from '@/components/gallery/work-image-thumb'
import { selectAboutImage } from './_lib/select-about-image'

const description =
  'About CarShop — automotive upholstery, restoration and custom interior work.'

export const metadata: Metadata = {
  title: 'About',
  description,
  alternates: {
    canonical: new URL('/about', clientEnv.NEXT_PUBLIC_SITE_URL).toString(),
  },
  openGraph: {
    title: 'About',
    description,
  },
}

const textLinkClassName =
  'inline-flex min-h-11 w-fit items-center gap-2 rounded-lg text-body font-semibold text-foreground outline-none transition-colors hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50'

export default async function AboutPage() {
  let works: Work[] = []

  try {
    works = await getWorks()
  } catch (error) {
    // Degradação silenciosa: sem a API o About continua útil (apenas
    // tipográfico), sem toast nem mensagem de estado.
    console.error('Failed to fetch works for /about:', error)
  }

  const featured = selectAboutImage(works)

  return (
    <>
      <PageSection
        spacing="editorial"
        container="reading"
        aria-labelledby="about-heading"
      >
        <div className="flex flex-col gap-6">
          <h1 id="about-heading" className="text-display-lg text-foreground">
            About CarShop
          </h1>
          {/* Ponto de inserção da história aprovada do negócio (pendente). */}
          <p className="text-body-lg text-secondary-foreground">
            Automotive upholstery, restoration and custom interior work.
          </p>
        </div>
      </PageSection>

      {featured && (
        <PageSection spacing="compact" container="none" className="pt-0 lg:pt-0">
          <Container variant="page">
            <figure className="flex flex-col gap-3 md:px-8 lg:px-0">
              {/* Única imagem da página e candidata a LCP. */}
              <WorkImageThumb
                image={featured.image}
                fallbackAlt={featured.work.title}
                sizes="(min-width: 1280px) 1120px, 100vw"
                preload
                className="aspect-4/3 md:aspect-video"
              />
              <figcaption className="flex flex-col gap-1">
                <span className="text-label text-muted-foreground">
                  {featured.work.category}
                </span>
                <Link
                  href={`/portfolio/${featured.work.slug}`}
                  className={textLinkClassName}
                >
                  {featured.work.title}
                  <LuArrowRight aria-hidden="true" className="size-4 shrink-0" />
                </Link>
              </figcaption>
            </figure>
          </Container>
        </PageSection>
      )}

      <PageSection
        as="nav"
        spacing="standard"
        container="reading"
        className="border-t border-border"
        aria-label="Explore CarShop"
      >
        <ul className="flex flex-col gap-2 sm:flex-row sm:gap-10">
          <li>
            <Link href="/services" className={textLinkClassName}>
              See our services
              <LuArrowRight aria-hidden="true" className="size-4 shrink-0" />
            </Link>
          </li>
          <li>
            <Link href="/portfolio" className={textLinkClassName}>
              View our work
              <LuArrowRight aria-hidden="true" className="size-4 shrink-0" />
            </Link>
          </li>
        </ul>
      </PageSection>
    </>
  )
}
