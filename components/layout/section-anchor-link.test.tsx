import { afterEach, describe, expect, it, vi } from 'vitest'
import { createRef, type MouseEvent, type ReactNode } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/button'
import { SectionAnchorLink } from './section-anchor-link'

const SECTION_ID = 'our-work'

function renderWithSection(ui: ReactNode) {
  return render(
    <>
      {ui}
      <section id={SECTION_ID} tabIndex={-1} aria-label="Our Work section">
        <button type="button">First control</button>
      </section>
    </>,
  )
}

function getSection(): HTMLElement {
  const section = document.getElementById(SECTION_ID)
  if (!section) throw new Error('#our-work não montada')
  return section
}

function getLink(): HTMLElement {
  return screen.getByRole('link', { name: 'View Our Work' })
}

describe('SectionAnchorLink', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renderiza um link para /#<sectionId> com o conteúdo recebido', () => {
    render(<SectionAnchorLink sectionId={SECTION_ID}>View Our Work</SectionAnchorLink>)

    expect(getLink()).toHaveAttribute('href', '/#our-work')
  })

  it('usa o sectionId recebido para montar o href', () => {
    render(<SectionAnchorLink sectionId="process">How it works</SectionAnchorLink>)

    expect(screen.getByRole('link', { name: 'How it works' })).toHaveAttribute(
      'href',
      '/#process',
    )
  })

  it('clique esquerdo simples move o foco para a seção, com preventScroll', () => {
    renderWithSection(
      <SectionAnchorLink sectionId={SECTION_ID}>View Our Work</SectionAnchorLink>,
    )
    const focusSpy = vi.spyOn(getSection(), 'focus')

    fireEvent.click(getLink())

    expect(focusSpy).toHaveBeenCalledTimes(1)
    expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true })
    expect(getSection()).toHaveFocus()
  })

  it.each([
    ['ctrl', { ctrlKey: true }],
    ['meta', { metaKey: true }],
    ['shift', { shiftKey: true }],
    ['alt', { altKey: true }],
    ['botão do meio', { button: 1 }],
    ['botão direito', { button: 2 }],
  ])('clique com %s não move o foco', (_label, init) => {
    renderWithSection(
      <SectionAnchorLink sectionId={SECTION_ID}>View Our Work</SectionAnchorLink>,
    )
    const link = getLink()
    link.focus()
    const focusSpy = vi.spyOn(getSection(), 'focus')

    fireEvent.click(link, init)

    expect(focusSpy).not.toHaveBeenCalled()
    expect(getSection()).not.toHaveFocus()
    expect(link).toHaveFocus()
  })

  it('chama o onClick recebido e ainda move o foco', () => {
    const onClick = vi.fn()
    renderWithSection(
      <SectionAnchorLink sectionId={SECTION_ID} onClick={onClick}>
        View Our Work
      </SectionAnchorLink>,
    )

    fireEvent.click(getLink())

    expect(onClick).toHaveBeenCalledTimes(1)
    expect(getSection()).toHaveFocus()
  })

  it('chama o onClick mesmo quando o clique usa modificador', () => {
    const onClick = vi.fn()
    renderWithSection(
      <SectionAnchorLink sectionId={SECTION_ID} onClick={onClick}>
        View Our Work
      </SectionAnchorLink>,
    )

    fireEvent.click(getLink(), { metaKey: true })

    expect(onClick).toHaveBeenCalledTimes(1)
    expect(getSection()).not.toHaveFocus()
  })

  it('onClick com preventDefault (defaultPrevented) impede a mudança de foco', () => {
    renderWithSection(
      <SectionAnchorLink
        sectionId={SECTION_ID}
        onClick={(event: MouseEvent<HTMLAnchorElement>) => event.preventDefault()}
      >
        View Our Work
      </SectionAnchorLink>,
    )
    const focusSpy = vi.spyOn(getSection(), 'focus')

    fireEvent.click(getLink())

    expect(focusSpy).not.toHaveBeenCalled()
    expect(getSection()).not.toHaveFocus()
  })

  it('sem a seção na página, o clique não lança erro', () => {
    render(<SectionAnchorLink sectionId={SECTION_ID}>View Our Work</SectionAnchorLink>)

    expect(() => fireEvent.click(getLink())).not.toThrow()
  })

  it('repassa ref e className para a âncora', () => {
    const ref = createRef<HTMLAnchorElement>()
    render(
      <SectionAnchorLink ref={ref} sectionId={SECTION_ID} className="custom-class">
        View Our Work
      </SectionAnchorLink>,
    )

    const link = getLink()
    expect(ref.current).toBe(link)
    expect(link).toHaveClass('custom-class')
  })

  it('dentro de Button asChild, a âncora recebe as classes do botão e mantém o foco na seção', () => {
    renderWithSection(
      <Button asChild size="lg" className="h-11 px-6">
        <SectionAnchorLink sectionId={SECTION_ID}>View Our Work</SectionAnchorLink>
      </Button>,
    )

    const link = getLink()
    expect(link.tagName).toBe('A')
    expect(link).toHaveAttribute('data-slot', 'button')
    expect(link).toHaveClass('h-11', 'px-6')
    expect(link).toHaveAttribute('href', '/#our-work')

    fireEvent.click(link)

    expect(getSection()).toHaveFocus()
  })
})
