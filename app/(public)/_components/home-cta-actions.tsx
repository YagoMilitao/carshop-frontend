import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ContactAnchorLink } from "@/components/contact/contact-anchor-link"

type HomeCtaActionsProps = {
  /**
   * Exibe o link "Get a Quote". Desligado dentro da própria seção
   * `#contact`, onde o link apontaria para a seção atual.
   */
  showQuoteLink?: boolean
}

/**
 * Ações de CTA públicas, compartilhadas entre Hero, `#contact`, `/contact`
 * e `/services`.
 *
 * "Get a Quote" é um link para a seção `#contact` da Home (CARSHOP-171) —
 * não há fluxo de orçamento/endpoint. `h-11` garante alvo de toque de 44px
 * sem alterar os tamanhos de `components/ui/button.tsx`.
 */
export function HomeCtaActions({
  showQuoteLink = true,
}: Readonly<HomeCtaActionsProps>) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <Button asChild size="lg" className="h-11 px-6">
        <Link href="/portfolio">View Our Work</Link>
      </Button>
      {showQuoteLink && (
        <Button asChild variant="outline" size="lg" className="h-11 px-6">
          <ContactAnchorLink>Get a Quote</ContactAnchorLink>
        </Button>
      )}
    </div>
  )
}
