"use client"

import type { ComponentProps, MouseEvent } from "react"
import Link from "next/link"
import { CONTACT_HREF, CONTACT_SECTION_ID } from "./contact-anchor"

type ContactAnchorLinkProps = Omit<ComponentProps<typeof Link>, "href">

/**
 * Link para `/#contact` (CARSHOP-171). Na navegação só de hash na mesma
 * página, o App Router rola até a seção mas não move o foco; aqui o foco vai
 * para `#contact` (`tabIndex={-1}`) para o próximo Tab cair no primeiro
 * controle da seção. Em troca de rota o elemento ainda não existe e o
 * comportamento padrão do Next se mantém. `preventScroll` deixa a rolagem
 * a cargo do Next. Repassa `ref`/`className` para funcionar com
 * `Button asChild`.
 */
export function ContactAnchorLink({ onClick, ...props }: ContactAnchorLinkProps) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event)

    if (
      event.defaultPrevented ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    ) {
      return
    }

    document.getElementById(CONTACT_SECTION_ID)?.focus({ preventScroll: true })
  }

  return <Link {...props} href={CONTACT_HREF} onClick={handleClick} />
}
