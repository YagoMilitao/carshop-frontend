import type { Metadata } from 'next'
import { clientEnv } from '@/lib/env/client'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Contact CarShop — page under construction.',
  alternates: {
    canonical: new URL('/contact', clientEnv.NEXT_PUBLIC_SITE_URL).toString(),
  },
  openGraph: {
    title: 'Contact',
    description: 'Contact CarShop — page under construction.',
  },
}

// Server Component wrapper: o formulário de contato futuro deve ser um
// Client Component isolado (boundary mínima), não a página inteira.
export default function ContactPage() {
  return (
    <div>
      <h1>Contact</h1>
      <p>Página em construção.</p>
    </div>
  )
}
