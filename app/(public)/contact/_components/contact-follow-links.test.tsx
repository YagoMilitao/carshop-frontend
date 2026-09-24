import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ContactFollowLinks } from './contact-follow-links'

describe('ContactFollowLinks', () => {
  it('renderiza h2 e links externos seguros com aviso de nova aba', () => {
    render(
      <ContactFollowLinks
        links={[
          { href: 'https://instagram.com/example', label: 'Instagram' },
          { href: 'https://linkedin.com/company/example', label: 'LinkedIn' },
        ]}
      />,
    )

    expect(screen.getByRole('heading', { level: 2, name: 'Follow CarShop' })).toBeInTheDocument()

    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(2)
    for (const link of links) {
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noreferrer')
      expect(link).toHaveClass('min-h-11')
      expect(link.querySelector('.sr-only')).toHaveTextContent('(opens in a new tab)')
    }
    expect(links[0]).toHaveAccessibleName('Instagram (opens in a new tab)')
    expect(links[1]).toHaveAttribute('href', 'https://linkedin.com/company/example')
  })
})
