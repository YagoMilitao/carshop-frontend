import type { SocialLink } from "@/lib/social-links"

type ContactFollowLinksProps = {
  links: readonly SocialLink[]
  /** Nível do heading conforme a hierarquia da página hospedeira. */
  headingLevel?: 2 | 3
}

/**
 * Canais sociais realmente configurados (CARSHOP-147), compartilhados entre
 * `/contact` e a seção `#contact` da Home (CARSHOP-171). Recebe os links
 * via prop — a leitura do ambiente fica no Server Component hospedeiro
 * (server-only).
 */
export function ContactFollowLinks({
  links,
  headingLevel = 2,
}: Readonly<ContactFollowLinksProps>) {
  const Heading = headingLevel === 3 ? "h3" : "h2"

  return (
    <section
      aria-labelledby="contact-follow-heading"
      className="flex flex-col gap-4 border-t border-border pt-8 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8"
    >
      <Heading id="contact-follow-heading" className="text-heading-4 text-foreground">
        Follow CarShop
      </Heading>
      <ul className="flex flex-col">
        {links.map((link) => (
          <li key={link.label}>
            <a
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 w-fit items-center rounded-lg text-body font-semibold text-foreground outline-hidden transition-colors hover:text-primary focus-visible:ring-3 focus-visible:ring-focus-ring"
            >
              {link.label}{" "}
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
