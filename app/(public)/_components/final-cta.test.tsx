import { afterEach, describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import type { SocialLink } from '@/lib/social-links'
import { FinalCta } from './final-cta'

const socialLinks: readonly SocialLink[] = [
  { href: 'https://instagram.com/example', label: 'Instagram' },
  { href: 'https://facebook.com/example', label: 'Facebook' },
]

function getContactSection(container: HTMLElement): HTMLElement {
  const section = container.querySelector<HTMLElement>('section#contact')
  if (!section) throw new Error('section#contact não encontrada')
  return section
}

describe('FinalCta (#contact)', () => {
  it('renderiza section#contact focável programaticamente e rotulada por um único h2', () => {
    const { container } = render(<FinalCta socialLinks={[]} />)
    const section = getContactSection(container)

    expect(section).toHaveAttribute('tabindex', '-1')
    expect(section).toHaveAttribute('aria-labelledby', 'home-contact-heading')

    const h2s = within(section).getAllByRole('heading', { level: 2 })
    expect(h2s).toHaveLength(1)
    expect(h2s[0]).toHaveAttribute('id', 'home-contact-heading')
    expect(h2s[0]).toHaveTextContent('Ready to transform your interior?')
    expect(screen.getByRole('region', { name: 'Ready to transform your interior?' })).toBe(section)
  })

  describe('com hash #contact na URL', () => {
    const initialUrl = window.location.href

    afterEach(() => {
      window.history.replaceState(null, '', initialUrl)
    })

    it('foca section#contact ao renderizar (chegada por troca de rota ou carga direta)', () => {
      window.history.replaceState(null, '', '/#contact')
      const { container } = render(<FinalCta socialLinks={[]} />)

      expect(getContactSection(container)).toHaveFocus()
    })
  })

  it('"View Our Work" → /portfolio e "Contact CarShop" → /contact; sem "Get a Quote"', () => {
    const { container } = render(<FinalCta socialLinks={socialLinks} />)
    const section = getContactSection(container)

    expect(within(section).getByRole('link', { name: 'View Our Work' })).toHaveAttribute(
      'href',
      '/portfolio',
    )
    const contact = within(section).getByRole('link', { name: 'Contact CarShop' })
    expect(contact).toHaveAttribute('href', '/contact')
    expect(contact).toHaveClass('min-h-11')
    expect(within(section).queryByText(/get a quote/i)).not.toBeInTheDocument()
    expect(within(section).queryByRole('button')).not.toBeInTheDocument()
  })

  it('com links sociais: lista com links externos seguros, h3 e layout em duas colunas', () => {
    const { container } = render(<FinalCta socialLinks={socialLinks} />)
    const section = getContactSection(container)

    expect(
      within(section).getByRole('heading', { level: 3, name: 'Follow CarShop' }),
    ).toBeInTheDocument()
    expect(within(section).getByRole('list')).toBeInTheDocument()

    for (const label of ['Instagram', 'Facebook']) {
      const link = within(section).getByRole('link', { name: `${label} (opens in a new tab)` })
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noreferrer')
      expect(link.querySelector('.sr-only')).toHaveTextContent('(opens in a new tab)')
    }

    const main = screen.getByRole('heading', { level: 2 }).parentElement
    expect(main).toHaveClass('lg:col-span-7')
    expect(main).not.toHaveClass('max-w-4xl')
  })

  it('sem links sociais: omite o bloco de canais e usa coluna única', () => {
    const { container } = render(<FinalCta socialLinks={[]} />)
    const section = getContactSection(container)

    expect(within(section).queryByRole('list')).not.toBeInTheDocument()
    expect(within(section).queryByRole('heading', { level: 3 })).not.toBeInTheDocument()
    expect(within(section).queryByText('Follow CarShop')).not.toBeInTheDocument()

    const main = screen.getByRole('heading', { level: 2 }).parentElement
    expect(main).toHaveClass('max-w-4xl')
    expect(main).not.toHaveClass('lg:col-span-7')
  })

  it('não publica telefone, e-mail, endereço, horário, "free", "coming soon" nem imagens', () => {
    const { container } = render(<FinalCta socialLinks={socialLinks} />)
    const section = getContactSection(container)
    const text = section.textContent ?? ''

    expect(section.querySelector('a[href^="tel:"]')).toBeNull()
    expect(section.querySelector('a[href^="mailto:"]')).toBeNull()
    expect(section.querySelector('address')).toBeNull()
    expect(section.querySelector('form')).toBeNull()
    expect(text).not.toMatch(/\(\d{3}\)|\d{3}[-.\s]\d{4}|@|\bhours\b|street|\bave\b/i)
    expect(text).not.toMatch(/\bfree\b|coming soon|built to last/i)
    expect(within(section).queryByRole('img')).not.toBeInTheDocument()
  })
})
