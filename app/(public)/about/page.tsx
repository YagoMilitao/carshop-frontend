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
      <h1>About</h1>
      <p>Página em construção.</p>
    </PageSection>
  )
}
