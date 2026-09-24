'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { PageSection } from '@/components/layout/page-section'
import { PortfolioStateMessage } from '../_components/portfolio-state-message'
import { BackToPortfolioLink } from './_components/back-to-portfolio-link'

/** Mesma mensagem no toast e no texto inline. */
const PROJECT_ERROR_MESSAGE =
  "We couldn't load this project right now. Please try again in a few moments."

type ProjectDetailsErrorProps = {
  error: Error & { digest?: string }
  /** Next 16.3+: `router.refresh()` + reset em transição (refaz o fetch no servidor). */
  retry: () => void
}

export default function ProjectDetailsError({
  error,
  retry,
}: Readonly<ProjectDetailsErrorProps>) {
  useEffect(() => {
    toast.error(PROJECT_ERROR_MESSAGE)
    console.error(error)
  }, [error])

  return (
    <PageSection spacing="compact">
      <PortfolioStateMessage
        headingLevel={1}
        title="We couldn't load this project"
        message={PROJECT_ERROR_MESSAGE}
      >
        <Button size="lg" className="h-11 px-6" onClick={() => retry()}>
          Try again
        </Button>
        <BackToPortfolioLink />
      </PortfolioStateMessage>
    </PageSection>
  )
}
