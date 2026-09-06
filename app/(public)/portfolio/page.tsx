import type { Metadata } from 'next'
import { clientEnv } from '@/lib/env/client'

// TODO: listagem estática por ora; candidato a ISR (`revalidate`) assim que
// a API de projetos existir e a página passar a buscar dados reais.
export const metadata: Metadata = {
  title: 'Portfolio',
  description: 'CarShop portfolio — page under construction.',
  alternates: {
    canonical: new URL('/portfolio', clientEnv.NEXT_PUBLIC_SITE_URL).toString(),
  },
  openGraph: {
    title: 'Portfolio',
    description: 'CarShop portfolio — page under construction.',
  },
}

export default function PortfolioPage() {
  return (
    <main>
      <h1>Portfolio</h1>
      <p>Página em construção.</p>
    </main>
  )
}
