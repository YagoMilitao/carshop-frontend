import { LuArrowRight } from "react-icons/lu"
import { PageSection } from "@/components/layout/page-section"
import { ContactAnchorLink } from "@/components/contact/contact-anchor-link"
import { ContactFollowLinks } from "@/components/contact/contact-follow-links"
import { CONTACT_SECTION_ID } from "@/components/contact/contact-anchor"
import { ContactSectionFocus } from "@/components/contact/contact-section-focus"
import type { SocialLink } from "@/lib/social-links"
import { cn } from "@/lib/utils"
import { HomeCtaActions, type HomeCtaWorkTarget } from "./home-cta-actions"

type FinalCtaProps = {
  socialLinks: readonly SocialLink[]
  workTarget?: HomeCtaWorkTarget
}

/**
 * Seção `#contact` da Home (CARSHOP-171): fechamento do funil, sempre
 * presente e independente da API de works. Usa apenas canais reais — links
 * sociais configurados no ambiente; sem formulário nem dados de contato
 * inventados. "Contact DreamUP" aponta para a própria âncora `/#contact`
 * (CARSHOP-162), mantendo o visitante na Home single-page.
 *
 * `tabIndex={-1}` permite mover o foco para a seção ao navegar para
 * `/#contact`: `ContactSectionFocus` na chegada (troca de rota ou carga
 * direta) e `ContactAnchorLink` na mesma página. Ordem do DOM = leitura no mobile (sem CSS
 * `order`).
 */
export function FinalCta({
  socialLinks,
  workTarget,
}: Readonly<FinalCtaProps>) {
  const hasSocialLinks = socialLinks.length > 0

  return (
    <PageSection
      spacing="standard"
      id={CONTACT_SECTION_ID}
      tabIndex={-1}
      aria-labelledby="home-contact-heading"
      className="border-t border-border outline-hidden"
    >
      <ContactSectionFocus />
      <div
        className={cn(
          "grid grid-cols-1 gap-12",
          hasSocialLinks && "lg:grid-cols-12 lg:items-start lg:gap-8",
        )}
      >
        <div
          className={cn(
            "flex flex-col gap-8",
            hasSocialLinks ? "lg:col-span-7" : "max-w-4xl",
          )}
        >
          <h2 id="home-contact-heading" className="text-display-lg text-foreground">
            Ready to transform your interior?
          </h2>
          <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
            <HomeCtaActions showQuoteLink={false} workTarget={workTarget} />
            <ContactAnchorLink
              className="inline-flex min-h-11 w-fit items-center gap-2 rounded-lg text-nav text-foreground outline-hidden hover:text-primary focus-visible:ring-3 focus-visible:ring-focus-ring"
            >
              Contact DreamUP
              <LuArrowRight aria-hidden="true" className="size-4 shrink-0" />
            </ContactAnchorLink>
          </div>
        </div>

        {hasSocialLinks && (
          <div className="lg:col-span-4 lg:col-start-9">
            <ContactFollowLinks links={socialLinks} headingLevel={3} />
          </div>
        )}
      </div>
    </PageSection>
  )
}
