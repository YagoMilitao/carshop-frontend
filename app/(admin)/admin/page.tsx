import type { Metadata } from 'next'

// Defesa em profundidade: além de `app/robots.ts` bloquear `/admin`
// globalmente, a própria página reforça `noindex` — Admin nunca é
// tratado como conteúdo público indexável.
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
}

export default function AdminPage() {
  return (
    <main>
      <h1>Admin</h1>
      <p>Área administrativa — em construção.</p>
    </main>
  )
}
