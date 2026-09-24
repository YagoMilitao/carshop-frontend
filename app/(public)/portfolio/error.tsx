'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { PageSection } from '@/components/layout/page-section'
import { PortfolioHeader } from './_components/portfolio-header'
import {
  BackToHomeLink,
  PORTFOLIO_ERROR_MESSAGE,
  PortfolioStateMessage,
} from './_components/portfolio-state-message'

type PortfolioErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function PortfolioError({
  error,
  reset,
}: Readonly<PortfolioErrorProps>) {
  useEffect(() => {
    toast.error(PORTFOLIO_ERROR_MESSAGE)
    console.error(error)
  }, [error])

  return (
    <PageSection spacing="compact">
      <PortfolioHeader />
      <div className="mt-10 lg:mt-16">
        <PortfolioStateMessage
          title="We couldn't load the portfolio"
          message={PORTFOLIO_ERROR_MESSAGE}
        >
          <Button size="lg" className="h-11 px-6" onClick={() => reset()}>
            Try again
          </Button>
          <BackToHomeLink />
        </PortfolioStateMessage>
      </div>
    </PageSection>
  )
}
