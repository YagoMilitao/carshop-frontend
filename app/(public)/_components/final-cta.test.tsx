import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FinalCta } from './final-cta'

describe('FinalCta', () => {
  it('renderiza heading h2 rotulando a seção e os CTAs compartilhados', () => {
    const { container } = render(<FinalCta />)

    expect(
      screen.getByRole('heading', { level: 2, name: 'Ready to transform your interior?' }),
    ).toBeInTheDocument()
    expect(container.querySelector('section')).toHaveAttribute(
      'aria-labelledby',
      'final-cta-heading',
    )
    expect(screen.getByRole('link', { name: 'View Our Work' })).toHaveAttribute(
      'href',
      '/portfolio',
    )
    expect(screen.getByRole('button', { name: 'Get a Quote (coming soon)' })).toBeDisabled()
  })

  it('não contém copy proibida nem imagens', () => {
    const { container } = render(<FinalCta />)
    const text = container.textContent ?? ''

    expect(text).not.toMatch(/built to last|\bfree\b/i)
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })
})
