import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { clientEnv } from '@/lib/env/client'
import { getWorks, type Work } from '@/lib/api/works'
import { ErrorToast } from '@/components/feedback/error-toast'
import { PageSection } from '@/components/layout/page-section'
import { buildPortfolioLayout } from './_lib/build-portfolio-layout'
import { PORTFOLIO_INTRO, PortfolioHeader } from './_components/portfolio-header'
import { PortfolioGrid } from './_components/portfolio-grid'
import { PortfolioTextEntry } from './_components/portfolio-text-entry'
import {
  BackToHomeLink,
  PORTFOLIO_ERROR_MESSAGE,
  PortfolioStateMessage,
} from './_components/portfolio-state-message'

export const metadata: Metadata = {
  title: 'Portfolio',
  description: PORTFOLIO_INTRO,
  alternates: {
    canonical: new URL('/portfolio', clientEnv.NEXT_PUBLIC_SITE_URL).toString(),
  },
  openGraph: {
    title: 'Portfolio',
    description: PORTFOLIO_INTRO,
  },
}

export default async function PortfolioPage() {
  let works: Work[] = []
  let failed = false

  try {
    works = await getWorks()
  } catch (error) {
    console.error('Failed to fetch works for /portfolio:', error)
    failed = true
  }

  let content: ReactNode

  if (failed) {
    content = (
      <>
        <ErrorToast message={PORTFOLIO_ERROR_MESSAGE} />
        <PortfolioStateMessage
          title="We couldn't load the portfolio"
          message={PORTFOLIO_ERROR_MESSAGE}
        >
          <BackToHomeLink />
        </PortfolioStateMessage>
      </>
    )
  } else if (works.length === 0) {
    content = (
      <PortfolioStateMessage
        title="No projects published yet"
        message="Published projects will appear here."
      >
        <BackToHomeLink />
      </PortfolioStateMessage>
    )
  } else {
    const { entries, textOnly } = buildPortfolioLayout(works)

    content = (
      <div className="flex flex-col gap-12 md:gap-16 lg:gap-24">
        {entries.length > 0 && <PortfolioGrid entries={entries} />}
        {textOnly.length > 0 && (
          <ul className="divide-y divide-border border-t border-border">
            {textOnly.map((work) => (
              <li key={work.id}>
                <PortfolioTextEntry work={work} />
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }

  return (
    <PageSection spacing="compact">
      <PortfolioHeader />
      <div className="mt-10 lg:mt-16">{content}</div>
    </PageSection>
  )
}
