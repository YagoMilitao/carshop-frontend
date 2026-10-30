"use client"

import type { ComponentProps } from "react"
import Link from "next/link"
import { SectionAnchorLink } from "@/components/layout/section-anchor-link"
import { CONTACT_SECTION_ID } from "./contact-anchor"

type ContactAnchorLinkProps = Omit<ComponentProps<typeof Link>, "href">

/**
 * Link para `/#contact` (CARSHOP-171). Wrapper fino de `SectionAnchorLink`,
 * que move o foco para `#contact` na navegação só de hash na mesma página.
 */
export function ContactAnchorLink(props: ContactAnchorLinkProps) {
  return <SectionAnchorLink {...props} sectionId={CONTACT_SECTION_ID} />
}
