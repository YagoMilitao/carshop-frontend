"use client"

import type { ComponentProps, MouseEvent } from "react"
import Link from "next/link"

type SectionAnchorLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  /** `id` da seção da Home; o link aponta para `/#<sectionId>`. */
  sectionId: string
}

/**
 * Link para uma seção da Home (`/#<sectionId>`). Na navegação só de hash na
 * mesma página, o App Router rola até a seção mas não move o foco; aqui o
 * foco vai para a seção (que deve ter `tabIndex={-1}`) para o próximo Tab
 * cair no primeiro controle dela. Em troca de rota o elemento ainda não
 * existe e o comportamento padrão do Next se mantém. `preventScroll` deixa a
 * rolagem a cargo do Next. Repassa `ref`/`className` para funcionar com
 * `Button asChild`.
 */
export function SectionAnchorLink({
  sectionId,
  onClick,
  ...props
}: SectionAnchorLinkProps) {
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

    document.getElementById(sectionId)?.focus({ preventScroll: true })
  }

  return <Link {...props} href={`/#${sectionId}`} onClick={handleClick} />
}
