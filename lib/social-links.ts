import "server-only"

import { serverEnv, type ServerEnv } from "@/lib/env/server"

export type SocialLink = {
  href: string
  label: "Instagram" | "Facebook" | "LinkedIn"
}

/**
 * Links sociais realmente configurados no ambiente (CARSHOP-133/147), em
 * ordem fixa. Redes sem URL configurada são omitidas: a ausência é o
 * estado padrão até o negócio fornecer os perfis reais.
 */
export function getSocialLinks(
  social: ServerEnv["social"] = serverEnv.social,
): SocialLink[] {
  const candidates: { href: string | undefined; label: SocialLink["label"] }[] = [
    { href: social.instagramUrl, label: "Instagram" },
    { href: social.facebookUrl, label: "Facebook" },
    { href: social.linkedinUrl, label: "LinkedIn" },
  ]

  const links: SocialLink[] = []

  for (const candidate of candidates) {
    if (candidate.href) {
      links.push({ href: candidate.href, label: candidate.label })
    }
  }

  return links
}
