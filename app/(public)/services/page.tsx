import type { Metadata } from 'next'
import { clientEnv } from '@/lib/env/client'
import { PageSection } from '@/components/layout/page-section'

export const metadata: Metadata = {
  title: 'Services',
  description: 'CarShop services — page under construction.',
  alternates: {
    canonical: new URL('/services', clientEnv.NEXT_PUBLIC_SITE_URL).toString(),
  },
  openGraph: {
    title: 'Services',
    description: 'CarShop services — page under construction.',
  },
}

export default function ServicesPage() {
  return (
    <PageSection>
      <h1>Services</h1>
      <p>Página em construção.</p>
    </PageSection>
  )
}
