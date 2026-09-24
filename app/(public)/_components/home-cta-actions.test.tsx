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

  it('"Get a Quote" é um botão desabilitado com semântica acessível de "em breve"', () => {
    render(<HomeCtaActions />)

    const button = screen.getByRole('button', { name: 'Get a Quote (coming soon)' })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-disabled', 'true')
    expect(button).toHaveTextContent('Get a Quote')
    expect(button.closest('a')).toBeNull()
  })

  it('"Get a Quote" não recebe foco por teclado (desabilitado)', async () => {
    const user = userEvent.setup()
    render(<HomeCtaActions />)

    await user.tab()
    expect(screen.getByRole('link', { name: 'View Our Work' })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('button', { name: 'Get a Quote (coming soon)' })).not.toHaveFocus()
  })

  it('ambos os CTAs têm alvo de toque de 44px (h-11)', () => {
    render(<HomeCtaActions />)

    expect(screen.getByRole('link', { name: 'View Our Work' })).toHaveClass('h-11')
    expect(screen.getByRole('button', { name: 'Get a Quote (coming soon)' })).toHaveClass('h-11')
  })
})
