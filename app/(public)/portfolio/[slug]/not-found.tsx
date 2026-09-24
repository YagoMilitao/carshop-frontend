import { PageSection } from '@/components/layout/page-section'
import { PortfolioStateMessage } from '../_components/portfolio-state-message'
import { BackToPortfolioLink } from './_components/back-to-portfolio-link'

/** Renderizado por `notFound()` do segmento, com HTTP 404 real. */
export default function ProjectNotFound() {
  return (
    <PageSection spacing="compact">
      <PortfolioStateMessage
        headingLevel={1}
        title="Project not found"
        message="This project doesn't exist or is no longer published."
      >
        <BackToPortfolioLink />
      </PortfolioStateMessage>
    </PageSection>
  )
}
