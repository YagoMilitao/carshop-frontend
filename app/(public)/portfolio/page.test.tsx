import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import PortfolioPage, { metadata } from './page'

describe('PortfolioPage (public placeholder)', () => {
  it('renderiza o título e o texto de placeholder da página', () => {
    render(<PortfolioPage />)

    expect(
      screen.getByRole('heading', { level: 1, name: 'Portfolio' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Página em construção.')).toBeInTheDocument()
  })

  it('define metadata (title, canonical e Open Graph)', () => {
    expect(metadata.title).toBe('Portfolio')
    expect(metadata.alternates?.canonical).toContain('/portfolio')
    expect(metadata.openGraph).toMatchObject({ title: 'Portfolio' })
  })
})
