import type { Metadata } from 'next'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { clientEnv } from '@/lib/env/client'
import { getCoverImage, getWorks, type Work } from '@/lib/api/works'
import { WorkImageThumb } from '@/components/gallery/work-image-thumb'
import { ErrorToast } from '@/components/feedback/error-toast'

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
        <p>{errorMessage}</p>
      </>
    )
  } else if (works.length === 0) {
    content = <p>Nenhum projeto publicado ainda.</p>
  } else {
    content = (
      <ul>
        {works.map((work) => {
          const cover = getCoverImage(work)

          return (
            <li key={work.id} className="flex items-center gap-3">
              {cover && (
                <WorkImageThumb
                  image={cover}
                  fallbackAlt={work.title}
                  sizes="64px"
                  className="size-16 shrink-0"
                />
              )}
              <Link href={`/portfolio/${work.slug}`}>{work.title}</Link>
            </li>
          )
        })}
      </ul>
    )
  }

  return (
    <div>
      <h1>Portfolio</h1>
      {content}
    </div>
  )
}
