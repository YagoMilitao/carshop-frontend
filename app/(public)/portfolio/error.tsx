'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

type PortfolioErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function PortfolioError({
  error,
  reset,
}: Readonly<PortfolioErrorProps>) {
  useEffect(() => {
    toast.error(
      'Não foi possível carregar o portfólio agora. Tente novamente em alguns instantes.',
    )
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <h1 className="text-lg font-semibold">
        Não foi possível carregar o portfólio
      </h1>
      <p className="text-muted-foreground">
        Ocorreu um erro ao buscar os projetos do portfólio. Tente
        novamente em alguns instantes.
      </p>
      <Button onClick={() => reset()}>Tentar novamente</Button>
    </div>
  )
}
