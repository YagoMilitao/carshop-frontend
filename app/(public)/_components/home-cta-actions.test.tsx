import { describe, expect, it } from 'vitest'
import type { ReactNode } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HomeCtaActions } from './home-cta-actions'

describe('HomeCtaActions', () => {
  it('"View Our Work" é um link para /portfolio', () => {
    render(<HomeCtaActions />)

    expect(screen.getByRole('link', { name: 'View Our Work' })).toHaveAttribute(
      'href',
      '/portfolio',
    )
  })

  it('"Get a Quote" é um link para /#contact com nome acessível igual ao texto', () => {
    render(<HomeCtaActions />)

    const quote = screen.getByRole('link', { name: 'Get a Quote' })
    expect(quote).toHaveAttribute('href', '/#contact')
    expect(quote).toHaveTextContent('Get a Quote')
    expect(quote).not.toHaveAttribute('aria-disabled')
    expect(quote).not.toHaveAttribute('aria-label')
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('ambos os CTAs são alcançáveis por teclado, na ordem do DOM', async () => {
    const user = userEvent.setup()
    render(<HomeCtaActions />)

    await user.tab()
    expect(screen.getByRole('link', { name: 'View Our Work' })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('link', { name: 'Get a Quote' })).toHaveFocus()
  })

  it('showQuoteLink={false} oculta "Get a Quote" e mantém "View Our Work"', () => {
    render(<HomeCtaActions showQuoteLink={false} />)

    expect(screen.queryByRole('link', { name: 'Get a Quote' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'View Our Work' })).toBeInTheDocument()
  })

  it('ambos os CTAs têm alvo de toque de 44px (h-11)', () => {
    render(<HomeCtaActions />)

    expect(screen.getByRole('link', { name: 'View Our Work' })).toHaveClass('h-11')
    expect(screen.getByRole('link', { name: 'Get a Quote' })).toHaveClass('h-11')
  })

  describe('workTarget (CARSHOP-165)', () => {
    function renderWithOurWork(ui: ReactNode) {
      return render(
        <>
          {ui}
          <section id="our-work" tabIndex={-1} aria-label="Our Work section">
            <button type="button">First control</button>
          </section>
        </>,
      )
    }

    function getOurWork(): HTMLElement {
      const section = document.getElementById('our-work')
      if (!section) throw new Error('#our-work não montada')
      return section
    }

    it('workTarget="portfolio" explícito mantém /portfolio', () => {
      render(<HomeCtaActions workTarget="portfolio" />)

      expect(screen.getByRole('link', { name: 'View Our Work' })).toHaveAttribute(
        'href',
        '/portfolio',
      )
    })

    it('workTarget="portfolio": clique não move o foco para #our-work', () => {
      renderWithOurWork(<HomeCtaActions workTarget="portfolio" />)

      fireEvent.click(screen.getByRole('link', { name: 'View Our Work' }))

      expect(getOurWork()).not.toHaveFocus()
    })

    it('workTarget="home-section": "View Our Work" aponta para /#our-work', () => {
      render(<HomeCtaActions workTarget="home-section" />)

      expect(screen.getByRole('link', { name: 'View Our Work' })).toHaveAttribute(
        'href',
        '/#our-work',
      )
      expect(screen.getByRole('link', { name: 'Get a Quote' })).toHaveAttribute(
        'href',
        '/#contact',
      )
    })

    it('workTarget="home-section": clique esquerdo move o foco para section#our-work', () => {
      renderWithOurWork(<HomeCtaActions workTarget="home-section" />)

      fireEvent.click(screen.getByRole('link', { name: 'View Our Work' }))

      expect(getOurWork()).toHaveFocus()
    })

    it('workTarget="home-section": ordem de Tab e alvo h-11 preservados', async () => {
      const user = userEvent.setup()
      render(<HomeCtaActions workTarget="home-section" />)

      const work = screen.getByRole('link', { name: 'View Our Work' })
      const quote = screen.getByRole('link', { name: 'Get a Quote' })
      expect(work).toHaveClass('h-11', 'px-6')
      expect(work).toHaveAttribute('data-slot', 'button')
      expect(quote).toHaveClass('h-11')

      await user.tab()
      expect(work).toHaveFocus()
      await user.tab()
      expect(quote).toHaveFocus()
    })

    it('workTarget="home-section" com showQuoteLink={false}: só "View Our Work" → /#our-work', () => {
      render(<HomeCtaActions workTarget="home-section" showQuoteLink={false} />)

      expect(screen.getAllByRole('link')).toHaveLength(1)
      expect(screen.getByRole('link', { name: 'View Our Work' })).toHaveAttribute(
        'href',
        '/#our-work',
      )
    })
  })
})
