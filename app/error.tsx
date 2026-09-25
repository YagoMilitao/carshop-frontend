'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { LuArrowRight } from 'react-icons/lu'
import { Button } from '@/components/ui/button'
import { Container } from '@/components/layout/container'

// error.tsx precisa ser Client Component por exigência do Next.js (o boundary
// de erro usa interatividade — reset). Copy em inglês, idioma do
// `<html lang="en-US">` (conflito C-3 de CARSHOP-149); um boundary pt-BR para
// o admin é follow-up (A-19).
type ErrorBoundaryProps = Readonly<{
  error: Error & { digest?: string }
  reset: () => void
}>

export default function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="py-16 lg:py-28">
      <Container variant="page">
        <div className="flex max-w-xl flex-col gap-4">
          <h1 className="text-heading-1 text-foreground">Something went wrong</h1>
          <p className="text-body text-secondary-foreground">
            An unexpected error occurred. Please try again in a few moments.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-8 gap-y-4">
            <Button size="lg" className="h-11 px-6" onClick={() => reset()}>
              Try again
            </Button>
            <Link
              href="/"
              className="inline-flex min-h-11 w-fit items-center gap-2 rounded-lg text-nav text-foreground outline-hidden hover:text-primary focus-visible:ring-3 focus-visible:ring-focus-ring"
            >
              Back to home
              <LuArrowRight aria-hidden="true" className="size-4 shrink-0" />
            </Link>
          </div>
        </div>
      </Container>
    </main>
  )
}
