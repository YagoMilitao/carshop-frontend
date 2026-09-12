'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

type ProjectDetailsErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ProjectDetailsError({
  error,
  reset,
}: Readonly<ProjectDetailsErrorProps>) {
  useEffect(() => {
    toast.error(
      'Não foi possível carregar este projeto agora. Tente novamente em alguns instantes.',
    )
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <h1 className="text-lg font-semibold">
        Não foi possível carregar este projeto
      </h1>
      <p className="text-muted-foreground">
        Ocorreu um erro ao buscar as informações deste projeto. Tente
        novamente em alguns instantes.
      </p>
      <Button onClick={() => reset()}>Tentar novamente</Button>
    </div>
  )
}
