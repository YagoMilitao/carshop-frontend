import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { ContactSectionFocus } from './contact-section-focus'

function renderSection(children?: ReactNode) {
  return render(
    <section id="contact" tabIndex={-1} aria-label="Contact section">
      <ContactSectionFocus />
      {children}
    </section>,
  )
}

describe('ContactSectionFocus', () => {
  let initialUrl: string

  beforeEach(() => {
    initialUrl = window.location.href
  })

  afterEach(() => {
    window.history.replaceState(null, '', initialUrl)
  })

  it('com hash #contact, foca a seção ao montar', () => {
    window.history.replaceState(null, '', '/#contact')
    renderSection()

    expect(screen.getByRole('region', { name: 'Contact section' })).toHaveFocus()
  })

  it.each([
    ['sem hash', '/'],
    ['com outro hash', '/#services'],
  ])('%s, não move o foco', (_label, url) => {
    window.history.replaceState(null, '', url)
    renderSection()

    expect(screen.getByRole('region', { name: 'Contact section' })).not.toHaveFocus()
    expect(document.body).toHaveFocus()
  })

  it('mantém o foco quando ele já está dentro da seção', () => {
    window.history.replaceState(null, '', '/#contact')
    const button = document.createElement('button')
    button.textContent = 'Inside'

    const { container } = render(
      <section id="contact" tabIndex={-1} aria-label="Contact section" />,
    )
    const section = container.querySelector('section')
    if (!section) throw new Error('section ausente')
    section.appendChild(button)
    button.focus()

    render(<ContactSectionFocus />)

    expect(button).toHaveFocus()
  })

  it('sem #contact na página, não lança erro', () => {
    window.history.replaceState(null, '', '/#contact')

    expect(() => render(<ContactSectionFocus />)).not.toThrow()
    expect(document.body).toHaveFocus()
  })

  it('não renderiza nada', () => {
    window.history.replaceState(null, '', '/')
    const { container } = render(<ContactSectionFocus />)

    expect(container).toBeEmptyDOMElement()
  })
})
