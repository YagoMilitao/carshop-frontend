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
      <h1 className="text-heading-1 text-foreground">Services</h1>
      <p className="text-body-lg text-secondary-foreground">
        Página em construção.
      </p>
    </PageSection>
  )
}
