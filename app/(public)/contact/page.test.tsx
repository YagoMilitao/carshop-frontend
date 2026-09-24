import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { SocialLink } from '@/lib/social-links'

const getSocialLinksMock = vi.fn<() => SocialLink[]>()

vi.mock('server-only', () => ({}))

vi.mock('@/lib/social-links', () => ({
  getSocialLinks: () => getSocialLinksMock(),
}))

async function renderContact() {
  const { default: ContactPage } = await import('./page')
  return render(ContactPage())
}

describe('ContactPage (public)', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renderiza um único h1, o eyebrow e a copy aprovada', async () => {
    getSocialLinksMock.mockReturnValue([])
    await renderContact()

    const headings = screen.getAllByRole('heading', { level: 1 })
    expect(headings).toHaveLength(1)
    expect(headings[0]).toHaveTextContent('Ready to transform your interior?')
    expect(screen.getByText('Contact')).toBeInTheDocument()
    expect(
      screen.getByText('Quote requests are coming soon. In the meantime, see our completed work.'),
    ).toBeInTheDocument()
  })

  it('mantém "Get a Quote" desabilitado e "View Our Work" para /portfolio', async () => {
    getSocialLinksMock.mockReturnValue([])
    await renderContact()

    const quote = screen.getByRole('button', { name: 'Get a Quote (coming soon)' })
    expect(quote).toBeDisabled()
    expect(quote).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByRole('link', { name: 'View Our Work' })).toHaveAttribute(
      'href',
      '/portfolio',
    )
  })

  it('não publica telefone, e-mail, endereço, horário nem formulário', async () => {
    getSocialLinksMock.mockReturnValue([
      { href: 'https://instagram.com/example', label: 'Instagram' },
    ])
    const { container } = await renderContact()
    const text = container.textContent ?? ''

    expect(container.querySelector('a[href^="tel:"]')).toBeNull()
    expect(container.querySelector('a[href^="mailto:"]')).toBeNull()
    expect(container.querySelector('form')).toBeNull()
    expect(container.querySelector('address')).toBeNull()
    expect(text).not.toMatch(/\(\d{3}\)|\d{3}[-.\s]\d{4}|@|\bhours\b|open (daily|mon)|street|\bave\b/i)
    expect(text).not.toMatch(/construction|em construção/i)
  })

  it('omite a seção social quando nenhum link está configurado', async () => {
    getSocialLinksMock.mockReturnValue([])
    await renderContact()

    expect(screen.queryByRole('heading', { name: 'Follow CarShop' })).not.toBeInTheDocument()
  })

  it('exibe a seção social quando há links configurados', async () => {
    getSocialLinksMock.mockReturnValue([
      { href: 'https://instagram.com/example', label: 'Instagram' },
      { href: 'https://facebook.com/example', label: 'Facebook' },
    ])
    await renderContact()

    expect(
      screen.getByRole('heading', { level: 2, name: 'Follow CarShop' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Instagram (opens in a new tab)' }),
    ).toHaveAttribute('href', 'https://instagram.com/example')
    expect(
      screen.getByRole('link', { name: 'Facebook (opens in a new tab)' }),
    ).toHaveAttribute('href', 'https://facebook.com/example')
  })

  it('ajusta a coluna principal conforme a presença da seção social', async () => {
    getSocialLinksMock.mockReturnValue([])
    const { unmount } = await renderContact()

    let main = screen.getByRole('heading', { level: 1 }).parentElement
    expect(main).toHaveClass('max-w-4xl')
    expect(main).not.toHaveClass('lg:col-span-7')
    unmount()

    getSocialLinksMock.mockReturnValue([
      { href: 'https://instagram.com/example', label: 'Instagram' },
    ])
    await renderContact()

    main = screen.getByRole('heading', { level: 1 }).parentElement
    expect(main).toHaveClass('lg:col-span-7')
    expect(main).not.toHaveClass('max-w-4xl')
  })

  it('define metadata sem "under construction"', async () => {
    const { metadata } = await import('./page')
    const description =
      'Contact CarShop about automotive upholstery, restoration and custom interior work.'

    expect(metadata.title).toBe('Contact')
    expect(metadata.description).toBe(description)
    expect(metadata.alternates?.canonical).toBe('http://localhost:3000/contact')
    expect(metadata.openGraph).toMatchObject({ title: 'Contact', description })
    expect(JSON.stringify(metadata)).not.toMatch(/construction/i)
  })
})
