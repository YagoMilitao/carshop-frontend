'use client'

// error.tsx é a única exceção obrigatória do framework para Client
// Component neste esqueleto: o boundary de erro do App Router precisa de
// interatividade (reset) e roda no cliente por exigência do Next.js.
type ErrorBoundaryProps = Readonly<{
  error: Error & { digest?: string }
  reset: () => void
}>

export default function ErrorBoundary({ reset }: ErrorBoundaryProps) {
  return (
    <main>
      <h1>Algo deu errado.</h1>
      <button type="button" onClick={() => reset()}>
        Tentar novamente
      </button>
    </main>
  )
}
