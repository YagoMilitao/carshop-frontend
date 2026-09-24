import Link from "next/link"
import { LuArrowLeft } from "react-icons/lu"

/** Retorno à listagem; mesma linguagem visual do `BackToHomeLink`. */
export function BackToPortfolioLink() {
  return (
    <Link
      href="/portfolio"
      className="inline-flex min-h-11 w-fit items-center gap-2 rounded-lg text-nav text-foreground outline-none hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <LuArrowLeft aria-hidden="true" className="size-4 shrink-0" />
      Back to portfolio
    </Link>
  )
}
