import type { Metadata } from 'next'
import { clientEnv } from '@/lib/env/client'
import { getWorks, type Work } from '@/lib/api/works'
import { PageSection } from '@/components/layout/page-section'
import { HomeCtaActions } from '../_components/home-cta-actions'
import { groupWorksByCategory } from './_lib/group-works-by-category'
import { ServiceCategoryRow } from './_components/service-category-row'

const description =
  'Upholstery · Restoration · Custom Work — services shown through real CarShop projects.'

export const metadata: Metadata = {
  title: 'Services',
  description,
  alternates: {
    canonical: new URL('/services', clientEnv.NEXT_PUBLIC_SITE_URL).toString(),
  },
  openGraph: {
    title: 'Services',
    description,
  },
}

export default async function ServicesPage() {
  let works: Work[] = []

  try {
    works = await getWorks()
  } catch (error) {
    // Degradação silenciosa: sem a API a página mantém header e CTAs,
    // sem toast nem mensagem de estado.
    console.error('Failed to fetch works for /services:', error)
  }

  // Serviços = categorias reais dos works publicados; não existe fonte
  // aprovada de descrições de serviço (dependência de conteúdo).
  const categories = groupWorksByCategory(works)
  const preloadIndex = categories.findIndex((category) => category.preview)

  return (
    <>
      <PageSection spacing="compact" aria-labelledby="services-heading">
        <header className="flex max-w-3xl flex-col gap-6">
          <h1 id="services-heading" className="text-display-lg text-foreground">
            Services
          </h1>
          <p className="text-body-lg text-secondary-foreground">
            Upholstery · Restoration · Custom Work
          </p>
        </header>
      </PageSection>

      {categories.length >= 1 && (
        <PageSection spacing="standard" className="pt-0 lg:pt-0" aria-label="Service categories">
          <ol role="list" className="divide-y divide-border border-t border-border">
            {categories.map((category, index) => (
              <li key={category.key}>
                <ServiceCategoryRow
                  category={category}
                  index={index}
                  preload={index === preloadIndex}
                />
              </li>
            ))}
          </ol>
        </PageSection>
      )}

      <PageSection spacing="standard" className="border-t border-border" aria-label="Next steps">
        <HomeCtaActions />
      </PageSection>
    </>
  )
}
