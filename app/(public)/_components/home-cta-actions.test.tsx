import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
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
})
