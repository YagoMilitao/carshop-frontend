import type { Metadata } from 'next'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { clientEnv } from '@/lib/env/client'
import { getCoverImage, getWorks, type Work } from '@/lib/api/works'
import { WorkImageThumb } from '@/components/gallery/work-image-thumb'
import { ErrorToast } from '@/components/feedback/error-toast'
import { PageSection } from '@/components/layout/page-section'

export const metadata: Metadata = {
  title: 'Portfolio',
  description: 'Confira os projetos e trabalhos realizados pela CarShop.',
  alternates: {
    canonical: new URL('/portfolio', clientEnv.NEXT_PUBLIC_SITE_URL).toString(),
  },
  openGraph: {
    title: 'Portfolio',
    description: 'Confira os projetos e trabalhos realizados pela CarShop.',
  },
}

export default async function PortfolioPage() {
  let works: Work[] = []
  let errorMessage: string | null = null

  try {
    works = await getWorks()
  } catch (error) {
    console.error('Falha ao buscar works em /portfolio:', error)
    errorMessage =
      'Não foi possível carregar o portfólio agora. Tente novamente em alguns instantes.'
  }

  let content: ReactNode

  if (errorMessage) {
    content = (
      <>
        <ErrorToast message={errorMessage} />
        <p className="text-body text-secondary-foreground">{errorMessage}</p>
      </>
    )
  } else if (works.length === 0) {
    content = (
      <p className="text-body text-secondary-foreground">
        Nenhum projeto publicado ainda.
      </p>
    )
  } else {
    content = (
      <div className="flex flex-col divide-y divide-border">
        {works.map((work) => {
          const cover = getCoverImage(work)

          return (
            <Link
              key={work.id}
              href={`/portfolio/${work.slug}`}
              aria-label={work.title}
              className="group flex items-center gap-6 py-8 outline-none first:pt-0 focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {cover && (
                <WorkImageThumb
                  image={cover}
                  fallbackAlt={work.title}
                  sizes="96px"
                  className="size-24 shrink-0 transition-transform duration-200 group-hover:scale-105"
                />
              )}
              <div className="flex flex-col gap-1">
                <span className="text-label text-muted-foreground">
                  {work.category}
                </span>
                <span className="text-heading-3 text-foreground transition-colors group-hover:text-primary">
                  {work.title}
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    )
  }

  return (
    <PageSection spacing="editorial">
      <h1 className="text-display-lg text-foreground">Portfolio</h1>
      <div className="mt-10">{content}</div>
    </PageSection>
  )
}
