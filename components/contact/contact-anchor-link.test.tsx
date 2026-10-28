import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import type { MouseEvent, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { ContactAnchorLink } from './contact-anchor-link'
import { CONTACT_HREF, CONTACT_SECTION_ID } from './contact-anchor'

function renderWithSection(ui: ReactNode) {
  return render(
    <>
      {ui}
      <section id={CONTACT_SECTION_ID} tabIndex={-1} aria-label="Contact section">
        <button type="button">First control</button>
      </section>
    </>,
  )
}

function getSection(): HTMLElement {
  const section = document.getElementById(CONTACT_SECTION_ID)
  if (!section) throw new Error('#contact não montada')
  return section
}

describe('ContactAnchorLink', () => {
  it('expõe as constantes da âncora de contato', () => {
    expect(CONTACT_SECTION_ID).toBe('contact')
    expect(CONTACT_HREF).toBe('/#contact')
  })

  it('renderiza um link para /#contact com o conteúdo recebido', () => {
    render(<ContactAnchorLink>Get a Quote</ContactAnchorLink>)

    expect(screen.getByRole('link', { name: 'Get a Quote' })).toHaveAttribute('href', '/#contact')
  })

  it('com #contact montada, o clique move o foco para a seção', () => {
    renderWithSection(<ContactAnchorLink>Get a Quote</ContactAnchorLink>)

    fireEvent.click(screen.getByRole('link', { name: 'Get a Quote' }))

    expect(getSection()).toHaveFocus()
  })

  it.each([
    ['ctrl', { ctrlKey: true }],
    ['meta', { metaKey: true }],
    ['shift', { shiftKey: true }],
    ['alt', { altKey: true }],
    ['botão do meio', { button: 1 }],
  ])('clique com %s não move o foco', (_label, init) => {
    renderWithSection(<ContactAnchorLink>Get a Quote</ContactAnchorLink>)
    const link = screen.getByRole('link', { name: 'Get a Quote' })
    link.focus()

    fireEvent.click(link, init)

    expect(getSection()).not.toHaveFocus()
    expect(link).toHaveFocus()
  })

  it('sem #contact na página, o clique não lança erro', () => {
    render(<ContactAnchorLink>Get a Quote</ContactAnchorLink>)

    expect(() => fireEvent.click(screen.getByRole('link', { name: 'Get a Quote' }))).not.toThrow()
  })

  it('chama o onClick recebido', () => {
    const onClick = vi.fn()
    renderWithSection(<ContactAnchorLink onClick={onClick}>Get a Quote</ContactAnchorLink>)

    fireEvent.click(screen.getByRole('link', { name: 'Get a Quote' }))

    expect(onClick).toHaveBeenCalledTimes(1)
    expect(getSection()).toHaveFocus()
  })

  it('onClick com preventDefault impede a mudança de foco', () => {
    renderWithSection(
      <ContactAnchorLink onClick={(event: MouseEvent<HTMLAnchorElement>) => event.preventDefault()}>
        Get a Quote
      </ContactAnchorLink>,
    )

    fireEvent.click(screen.getByRole('link', { name: 'Get a Quote' }))

    expect(getSection()).not.toHaveFocus()
  })

  it('dentro de Button asChild, a âncora recebe as classes do botão', () => {
    render(
      <Button asChild variant="outline" className="h-11 px-6">
        <ContactAnchorLink>Get a Quote</ContactAnchorLink>
      </Button>,
    )

    const link = screen.getByRole('link', { name: 'Get a Quote' })
    expect(link.tagName).toBe('A')
    expect(link).toHaveAttribute('data-slot', 'button')
    expect(link).toHaveClass('h-11', 'px-6')
    expect(link).toHaveAttribute('href', '/#contact')
  })
})
