import Link from "next/link"
import { Button } from "@/components/ui/button"

/**
 * Ações de CTA da Home, compartilhadas entre Hero e Final CTA.
 *
 * "Get a Quote" permanece desabilitado, idêntico ao header (CARSHOP-143),
 * até existir um fluxo de orçamento aprovado. `h-11` garante alvo de toque
 * de 44px sem alterar os tamanhos de `components/ui/button.tsx`.
 */
export function HomeCtaActions() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <Button asChild size="lg" className="h-11 px-6">
        <Link href="/portfolio">View Our Work</Link>
      </Button>
      <Button
        variant="outline"
        size="lg"
        className="h-11 px-6"
        disabled
        aria-disabled="true"
        aria-label="Get a Quote (coming soon)"
      >
        Get a Quote
      </Button>
    </div>
  )
}
