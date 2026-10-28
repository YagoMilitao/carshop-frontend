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

  it('usa h2 por padrão e h3 quando headingLevel={3}, mantendo o id fixo', () => {
    const links = [{ href: 'https://instagram.com/example', label: 'Instagram' }] as const

    const { unmount } = render(<ContactFollowLinks links={links} headingLevel={2} />)
    const h2 = screen.getByRole('heading', { level: 2, name: 'Follow CarShop' })
    expect(h2).toHaveAttribute('id', 'contact-follow-heading')
    unmount()

    const { container } = render(<ContactFollowLinks links={links} headingLevel={3} />)
    const h3 = screen.getByRole('heading', { level: 3, name: 'Follow CarShop' })
    expect(h3).toHaveAttribute('id', 'contact-follow-heading')
    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument()
    expect(container.querySelector('section')).toHaveAttribute(
      'aria-labelledby',
      'contact-follow-heading',
    )
  })
})
