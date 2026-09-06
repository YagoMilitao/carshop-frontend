import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import ContactPage, { metadata } from './page'

describe('ContactPage (public placeholder)', () => {
  it('renderiza o título e o texto de placeholder da página', () => {
    render(<ContactPage />)

    expect(
      screen.getByRole('heading', { level: 1, name: 'Contact' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Página em construção.')).toBeInTheDocument()
  })

  it('define metadata (title, canonical e Open Graph)', () => {
    expect(metadata.title).toBe('Contact')
    expect(metadata.alternates?.canonical).toContain('/contact')
    expect(metadata.openGraph).toMatchObject({ title: 'Contact' })
  })
})
