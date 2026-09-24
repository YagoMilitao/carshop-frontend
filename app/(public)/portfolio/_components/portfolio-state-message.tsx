import Link from "next/link"
import type { ReactNode } from "react"
import { LuArrowRight } from "react-icons/lu"

/** Mesma mensagem no toast e no texto inline (página e `error.tsx`). */
export const PORTFOLIO_ERROR_MESSAGE =
  "We couldn't load the portfolio right now. Please try again in a few moments."

type PortfolioStateMessageProps = {
  title: string
  message: string
  /** `1` quando o estado é o conteúdo principal da página (ex.: 404/erro do detalhe). */
  headingLevel?: 1 | 2
  children?: ReactNode
}

/** Bloco calmo e alinhado à esquerda para os estados de erro e vazio. */
export function PortfolioStateMessage({
  title,
  message,
  headingLevel = 2,
  children,
}: Readonly<PortfolioStateMessageProps>) {
  return (
    <div className="flex max-w-xl flex-col gap-4">
      {headingLevel === 1 ? (
        <h1 className="text-heading-1 text-foreground">{title}</h1>
      ) : (
        <h2 className="text-heading-3 text-foreground">{title}</h2>
      )}
      <p className="text-body text-secondary-foreground">{message}</p>
      {children && (
        <div className="mt-2 flex flex-wrap items-center gap-x-8 gap-y-4">
          {children}
        </div>
      )}
    </div>
  )
}

export function BackToHomeLink() {
  return (
    <Link
      href="/"
      className="inline-flex min-h-11 w-fit items-center gap-2 rounded-lg text-nav text-foreground outline-none hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      Back to home
      <LuArrowRight aria-hidden="true" className="size-4 shrink-0" />
    </Link>
  )
}
