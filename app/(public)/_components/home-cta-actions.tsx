import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ContactAnchorLink } from "@/components/contact/contact-anchor-link"
import { SectionAnchorLink } from "@/components/layout/section-anchor-link"
import { OUR_WORK_SECTION_ID } from "../_lib/home-anchors"

/**
 * Destino de "View Our Work": `"portfolio"` → `/portfolio`;
 * `"home-section"` → `/#our-work` (CARSHOP-165), usado na Home só quando a
 * seção "Our Work" é renderizada.
 */
export type HomeCtaWorkTarget = "portfolio" | "home-section"

type HomeCtaActionsProps = {
  /**
   * Exibe o link "Get a Quote". Desligado dentro da própria seção
   * `#contact`, onde o link apontaria para a seção atual.
   */
  showQuoteLink?: boolean
  workTarget?: HomeCtaWorkTarget
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
  workTarget = "portfolio",
}: Readonly<HomeCtaActionsProps>) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <Button asChild size="lg" className="h-11 px-6">
        {workTarget === "home-section" ? (
          <SectionAnchorLink sectionId={OUR_WORK_SECTION_ID}>
            View Our Work
          </SectionAnchorLink>
        ) : (
          <Link href="/portfolio">View Our Work</Link>
        )}
      </Button>
      {showQuoteLink && (
        <Button asChild variant="outline" size="lg" className="h-11 px-6">
          <ContactAnchorLink>Get a Quote</ContactAnchorLink>
        </Button>
      )}
    </div>
  )
}
