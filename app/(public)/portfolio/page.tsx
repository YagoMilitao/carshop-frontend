import type { Metadata } from 'next'
import Link from 'next/link'
import { clientEnv } from '@/lib/env/client'
import { getWorks } from '@/lib/api/works'

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
    <main>
      <h1>Portfolio</h1>
      <ul>
        {works.map((work) => (
          <li key={work.id}>
            <Link href={`/portfolio/${work.slug}`}>{work.title}</Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
