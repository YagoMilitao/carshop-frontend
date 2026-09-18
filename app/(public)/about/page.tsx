import type { Metadata } from 'next'
import { clientEnv } from '@/lib/env/client'
import { PageSection } from '@/components/layout/page-section'

export const metadata: Metadata = {
  title: 'About',
  description: 'About CarShop — page under construction.',
  alternates: {
    canonical: new URL('/about', clientEnv.NEXT_PUBLIC_SITE_URL).toString(),
  },
  openGraph: {
    title: 'About',
    description: 'About CarShop — page under construction.',
  },
}

export default function AboutPage() {
  return (
    <PageSection>
      <h1 className="text-heading-1 text-foreground">About</h1>
      <p className="text-body-lg text-secondary-foreground">
        Página em construção.
      </p>
    </PageSection>
  )
}
