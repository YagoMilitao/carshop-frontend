import type { SocialLink } from "@/lib/social-links"

type ContactFollowLinksProps = {
  links: readonly SocialLink[]
}

/**
 * Canais sociais realmente configurados (CARSHOP-147). Recebe os links
 * via prop — a leitura do ambiente fica na página (server-only).
 */
export function ContactFollowLinks({ links }: Readonly<ContactFollowLinksProps>) {
  return (
    <section
      aria-labelledby="contact-follow-heading"
      className="flex flex-col gap-4 border-t border-border pt-8 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8"
    >
      <h2 id="contact-follow-heading" className="text-heading-4 text-foreground">
        Follow CarShop
      </h2>
      <ul className="flex flex-col">
        {links.map((link) => (
          <li key={link.label}>
            <a
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 w-fit items-center rounded-lg text-body font-semibold text-foreground outline-none transition-colors hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50"
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
