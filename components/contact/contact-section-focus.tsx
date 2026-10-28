"use client"

import { useEffect } from "react"
import { CONTACT_SECTION_ID } from "./contact-anchor"

/**
 * Ilha sem UI (CARSHOP-171): ao montar `#contact` com a URL já em
 * `#contact` (troca de rota ou carga direta), move o foco para a seção, já
 * que o App Router só rola. A navegação na mesma página é tratada por
 * `ContactAnchorLink`. `preventScroll` deixa a rolagem a cargo do Next.
 */
export function ContactSectionFocus() {
  useEffect(() => {
    if (window.location.hash !== `#${CONTACT_SECTION_ID}`) return

    const section = document.getElementById(CONTACT_SECTION_ID)
    if (!section) return
    if (section.contains(document.activeElement)) return

    section.focus({ preventScroll: true })
  }, [])

  return null
}
