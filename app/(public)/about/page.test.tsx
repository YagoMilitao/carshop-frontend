import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import AboutPage, { metadata } from './page'

describe('AboutPage (public placeholder)', () => {
  it('renderiza o título e o texto de placeholder da página', () => {
    render(<AboutPage />)

    expect(
      screen.getByRole('heading', { level: 1, name: 'About' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Página em construção.')).toBeInTheDocument()
  })

  it('define metadata (title, canonical e Open Graph)', () => {
    expect(metadata.title).toBe('About')
    expect(metadata.alternates?.canonical).toContain('/about')
    expect(metadata.openGraph).toMatchObject({ title: 'About' })
  })
})
