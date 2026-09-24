import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import type { Work, WorkImage } from '@/lib/api/works'

const getWorksMock = vi.fn<() => Promise<Work[]>>()
const toastErrorMock = vi.fn()

vi.mock('server-only', () => ({}))

vi.mock('@/lib/api/works', () => ({
  getWorks: () => getWorksMock(),
  getCoverImage: (work: Work) => work.images.find((image) => image.isCover),
}))

vi.mock('sonner', () => ({
  toast: {
    error: (message: string) => toastErrorMock(message),
  },
}))

function makeImage(id: string, isCover: boolean, alt = `Interior ${id}`): WorkImage {
  return {
    id,
    url: `https://res.cloudinary.com/demo/${id}.jpg`,
    publicId: id,
    alt,
    isCover,
    order: 0,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
  }
}

function makeWork(id: string, options: { hasCover?: boolean; alt?: string } = {}): Work {
  const { hasCover = true, alt } = options

  return {
    id,
    slug: `work-${id}`,
    title: `Work ${id}`,
    description: 'Descrição',
    category: 'bancos',
    tags: [],
    images: [makeImage(`${id}-cover`, hasCover, alt)],
    status: 'published',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
    deletedAt: null,
  }
}

async function renderHome() {
  const { default: HomePage } = await import('./page')
  return render(await HomePage())
}

function expectDegradedHome() {
  expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  expect(
    screen.getByRole('heading', { level: 2, name: 'Ready to transform your interior?' }),
  ).toBeInTheDocument()
  expect(screen.queryByRole('img')).not.toBeInTheDocument()
  expect(screen.queryByRole('heading', { name: 'Our Work' })).not.toBeInTheDocument()
  expect(screen.queryByRole('link', { name: 'View all projects' })).not.toBeInTheDocument()
  expect(toastErrorMock).not.toHaveBeenCalled()
}

describe('HomePage (public)', () => {
  afterEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  describe('com works publicados com capa', () => {
    const works = ['1', '2', '3', '4', '5'].map((id) => makeWork(id))

    it('renderiza exatamente um h1 com a headline do Hero', async () => {
      getWorksMock.mockResolvedValue(works)
      await renderHome()

      const headings = screen.getAllByRole('heading', { level: 1 })
      expect(headings).toHaveLength(1)
      expect(headings[0]).toHaveTextContent('Crafted for your car. Built for the road.')
      expect(screen.getByText('Upholstery · Restoration · Custom Work')).toBeInTheDocument()
    })

    it('usa a capa do primeiro work como imagem do Hero, com priority apenas nela (demais lazy)', async () => {
      getWorksMock.mockResolvedValue(works)
      await renderHome()

      // No jsdom o `next/image` não reflete `fetchpriority`; `priority` é
      // observável pela ausência de `loading="lazy"` (mesmo padrão de
      // `work-image-thumb.test.tsx`).
      const images = screen.getAllByRole('img')
      const prioritized = images.filter(
        (image) => image.getAttribute('loading') !== 'lazy',
      )

      expect(images).toHaveLength(4)
      expect(prioritized).toHaveLength(1)
      expect(prioritized[0]).toHaveAttribute('alt', 'Interior 1-cover')
      expect(
        screen.getByRole('link', { name: 'Work 1' }),
      ).toHaveAttribute('href', '/portfolio/work-1')
    })

    it('renderiza "Our Work" com os 3 works seguintes, sem repetir o hero', async () => {
      getWorksMock.mockResolvedValue(works)
      await renderHome()

      const section = screen
        .getByRole('heading', { level: 2, name: 'Our Work' })
        .closest('section')
      expect(section).not.toBeNull()
      if (!section) return

      const scoped = within(section)
      const projectLinks = scoped
        .getAllByRole('link')
        .filter((link) => link.getAttribute('href')?.startsWith('/portfolio/'))

      expect(projectLinks.map((link) => link.getAttribute('href'))).toEqual([
        '/portfolio/work-2',
        '/portfolio/work-3',
        '/portfolio/work-4',
      ])
      expect(scoped.getAllByRole('heading', { level: 3 })).toHaveLength(3)
      expect(scoped.queryByRole('link', { name: 'Work 1' })).not.toBeInTheDocument()
      expect(scoped.queryByRole('link', { name: 'Work 5' })).not.toBeInTheDocument()
      expect(scoped.getByRole('link', { name: 'View all projects' })).toHaveAttribute(
        'href',
        '/portfolio',
      )
      expect(section).toHaveAttribute('aria-labelledby', 'our-work-heading')
    })

    it('usa o título do work como alt quando a imagem não tem alt', async () => {
      getWorksMock.mockResolvedValue([makeWork('1'), makeWork('2', { alt: '' })])
      await renderHome()

      expect(screen.getByAltText('Work 2')).toBeInTheDocument()
    })

    it('renderiza os CTAs: "View Our Work" para /portfolio e "Get a Quote" desabilitado', async () => {
      getWorksMock.mockResolvedValue(works)
      await renderHome()

      const viewOurWork = screen.getAllByRole('link', { name: 'View Our Work' })
      expect(viewOurWork).toHaveLength(2)
      for (const link of viewOurWork) {
        expect(link).toHaveAttribute('href', '/portfolio')
      }

      const quoteButtons = screen.getAllByRole('button', {
        name: 'Get a Quote (coming soon)',
      })
      expect(quoteButtons).toHaveLength(2)
      for (const button of quoteButtons) {
        expect(button).toBeDisabled()
        expect(button).toHaveAttribute('aria-disabled', 'true')
      }
    })

    it('compõe "Our Work" com 1 dominante + itens de apoio (≥2 capas em featured)', async () => {
      getWorksMock.mockResolvedValue(works)
      await renderHome()

      const section = screen
        .getByRole('heading', { level: 2, name: 'Our Work' })
        .closest('section')
      expect(section).not.toBeNull()
      if (!section) return

      const scoped = within(section)
      const supportingList = scoped.getByRole('list')
      const supportingHrefs = within(supportingList)
        .getAllByRole('link')
        .map((link) => link.getAttribute('href'))

      // Dominante (work-2) fica fora da lista; apoio são work-3 e work-4.
      expect(supportingHrefs).toEqual(['/portfolio/work-3', '/portfolio/work-4'])
      expect(scoped.getByAltText('Interior 2-cover')).toHaveAttribute(
        'sizes',
        expect.stringContaining('66vw'),
      )
      expect(scoped.getByAltText('Interior 3-cover')).toHaveAttribute(
        'sizes',
        expect.stringContaining('33vw'),
      )
    })

    it('não exibe copy proibida nem seções sem dados reais (before/after, depoimentos, stats)', async () => {
      getWorksMock.mockResolvedValue(works)
      const { container } = await renderHome()
      const text = container.textContent ?? ''

      expect(text).not.toMatch(/built to last/i)
      expect(text).not.toMatch(/\bfree\b/i)
      expect(text).not.toMatch(/before\s*(&|and|\/)\s*after/i)
      expect(text).not.toMatch(/testimonial|what our (clients|customers) say|reviews?\b/i)
      expect(text).not.toMatch(/years of experience|happy customers|\d+\+/i)
      expect(text).not.toMatch(/Não foi possível|Nenhum projeto|em construção/)
    })

    it('associa cada seção ao seu heading via aria-labelledby', async () => {
      getWorksMock.mockResolvedValue(works)
      const { container } = await renderHome()

      const labelledBy = Array.from(container.querySelectorAll('section')).map((section) =>
        section.getAttribute('aria-labelledby'),
      )
      expect(labelledBy).toEqual(['home-hero-heading', 'our-work-heading', 'final-cta-heading'])
    })
  })

  it('pula works sem capa ao montar Hero e "Our Work"', async () => {
    getWorksMock.mockResolvedValue([
      makeWork('1', { hasCover: false }),
      makeWork('2'),
      makeWork('3', { hasCover: false }),
      makeWork('4'),
    ])
    await renderHome()

    expect(screen.queryByRole('link', { name: 'Work 1' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Work 3' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Work 2' })).toHaveAttribute('href', '/portfolio/work-2')
    expect(screen.getByRole('link', { name: 'Work 4' })).toHaveAttribute('href', '/portfolio/work-4')
    expect(screen.getAllByRole('img')).toHaveLength(2)
  })

  it('com uma única capa: Hero com imagem e sem seção "Our Work"', async () => {
    getWorksMock.mockResolvedValue([makeWork('1')])
    await renderHome()

    expect(screen.getAllByRole('img')).toHaveLength(1)
    expect(screen.queryByRole('heading', { name: 'Our Work' })).not.toBeInTheDocument()
  })

  it('com lista vazia: Hero tipográfico e Final CTA, sem imagens nem "Our Work"', async () => {
    getWorksMock.mockResolvedValue([])
    await renderHome()

    expectDegradedHome()
  })

  it('quando getWorks() falha: degrada silenciosamente e registra console.error', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    getWorksMock.mockRejectedValue(new Error('backend indisponível'))
    await renderHome()

    expectDegradedHome()
    expect(consoleErrorSpy).toHaveBeenCalled()
  })

  it('não usa copy proibida nem strings de estado em pt-BR', async () => {
    getWorksMock.mockResolvedValue([])
    const { container } = await renderHome()
    const text = container.textContent ?? ''

    expect(text).not.toMatch(/built to last/i)
    expect(text).not.toMatch(/\bfree\b/i)
    expect(text).not.toMatch(/Não foi possível|Nenhum projeto|em construção/)
  })

  it('define metadata com description e canonical da raiz', async () => {
    const { metadata } = await import('./page')

    expect(metadata.description).toBe(
      'Automotive upholstery, restoration and custom interior work.',
    )
    expect(metadata.alternates?.canonical).toBe('http://localhost:3000/')
    expect(metadata.openGraph).toMatchObject({
      description: 'Automotive upholstery, restoration and custom interior work.',
    })
  })
})
