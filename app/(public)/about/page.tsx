import type { Metadata } from 'next'
import { clientEnv } from '@/lib/env/client'

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
    <div>
      <h1>About</h1>
      <p>Página em construção.</p>
    </div>
  )
}
