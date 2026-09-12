import type { Metadata } from 'next'
import Link from 'next/link'
import { clientEnv } from '@/lib/env/client'
import { getCoverImage, getWorks } from '@/lib/api/works'
import { WorkImageThumb } from '@/components/gallery/work-image-thumb'

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
  const works = await getWorks()

  return (
    <div>
      <h1>Portfolio</h1>
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
    </div>
  )
}
