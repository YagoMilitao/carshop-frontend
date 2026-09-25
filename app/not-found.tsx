import type { Metadata } from 'next'
import Link from 'next/link'
import { LuArrowRight } from 'react-icons/lu'
import { Container } from '@/components/layout/container'

export const metadata: Metadata = {
  title: 'Page not found',
}

/**
 * 404 global. Renderizado fora do shell público (sem Header/Footer), por isso
 * declara o próprio `<main>`. Copy em inglês, idioma do `<html lang="en-US">`
 * (conflito C-3 de CARSHOP-149); o link replica o `BackToHomeLink` de
 * `portfolio/_components` inline para não acoplar a rota global ao segmento.
 */
export default function NotFound() {
  return (
    <main className="py-16 lg:py-28">
      <Container variant="page">
        <div className="flex max-w-xl flex-col gap-4">
          <h1 className="text-heading-1 text-foreground">Page not found</h1>
          <p className="text-body text-secondary-foreground">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
          <div className="mt-2">
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
