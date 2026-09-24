import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import type { Work, WorkImage } from '@/lib/api/works'

const getWorksMock = vi.fn<() => Promise<Work[]>>()

vi.mock('server-only', () => ({}))

vi.mock('@/lib/api/works', () => ({
  getWorks: () => getWorksMock(),
  getCoverImage: (work: Work) => work.images.find((image) => image.isCover),
}))

function makeImage(id: string, alt = `Interior ${id}`): WorkImage {
  return {
    id,
    url: `https://res.cloudinary.com/demo/${id}.jpg`,
    publicId: id,
    alt,
    isCover: true,
    order: 0,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
  }
}

function makeWork(id: string, options: { hasImage?: boolean; alt?: string } = {}): Work {
  const { hasImage = true, alt } = options

  return {
    id,
    slug: `work-${id}`,
    title: `Work ${id}`,
    description: 'Descrição',
    category: 'Bancos de couro',
    tags: [],
    images: hasImage ? [makeImage(`${id}-cover`, alt)] : [],
    status: 'published',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
    deletedAt: null,
  }
}

async function renderAbout() {
  const { default: AboutPage } = await import('./page')
  return render(await AboutPage())
}

function expectExploreLinks() {
  expect(screen.getByRole('link', { name: 'See our services' })).toHaveAttribute(
    'href',
    '/services',
  )
  expect(screen.getByRole('link', { name: 'View our work' })).toHaveAttribute(
    'href',
    '/portfolio',
  )
}

describe('AboutPage (public)', () => {
  afterEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  it('renderiza um único h1 e a descrição publicada', async () => {
    getWorksMock.mockResolvedValue([])
    await renderAbout()

    const headings = screen.getAllByRole('heading', { level: 1 })
    expect(headings).toHaveLength(1)
    expect(headings[0]).toHaveTextContent('About CarShop')
    expect(
      screen.getByText('Automotive upholstery, restoration and custom interior work.'),
    ).toBeInTheDocument()
  })

  it('exibe a foto do primeiro work com imagem, com figcaption e link do projeto', async () => {
    getWorksMock.mockResolvedValue([makeWork('1', { hasImage: false }), makeWork('2'), makeWork('3')])
    const { container } = await renderAbout()

    const figure = container.querySelector('figure')
    expect(figure).not.toBeNull()
    if (!figure) return

    const scoped = within(figure)
    const images = scoped.getAllByRole('img')
    expect(images).toHaveLength(1)
    expect(images[0]).toHaveAttribute('alt', 'Interior 2-cover')
    // `preload` é observável no jsdom pela ausência de `loading="lazy"`.
    expect(images[0]).not.toHaveAttribute('loading', 'lazy')
    expect(images[0]).toHaveAttribute('sizes', '(min-width: 1280px) 1120px, 100vw')

    const caption = figure.querySelector('figcaption')
    expect(caption).toHaveTextContent('Bancos de couro')
    expect(scoped.getByRole('link', { name: 'Work 2' })).toHaveAttribute(
      'href',
      '/portfolio/work-2',
    )
    expect(screen.getAllByRole('img')).toHaveLength(1)
    expectExploreLinks()
  })

  it('usa o título do work como alt quando a imagem não tem alt', async () => {
    getWorksMock.mockResolvedValue([makeWork('1', { alt: '' })])
    await renderAbout()

    expect(screen.getByAltText('Work 1')).toBeInTheDocument()
  })

  it('sem imagens: página tipográfica, sem figure', async () => {
    getWorksMock.mockResolvedValue([makeWork('1', { hasImage: false })])
    const { container } = await renderAbout()

    expect(container.querySelector('figure')).toBeNull()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expectExploreLinks()
  })

  it('quando getWorks() falha: degrada silenciosamente e registra console.error', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    getWorksMock.mockRejectedValue(new Error('backend indisponível'))
    const { container } = await renderAbout()

    expect(container.querySelector('figure')).toBeNull()
    expect(screen.getByRole('heading', { level: 1, name: 'About CarShop' })).toBeInTheDocument()
    expectExploreLinks()
    expect(consoleErrorSpy).toHaveBeenCalled()
  })

  it('não exibe copy inventada nem strings de placeholder', async () => {
    getWorksMock.mockResolvedValue([makeWork('1')])
    const { container } = await renderAbout()
    const text = container.textContent ?? ''

    expect(text).not.toMatch(/construction|em construção|coming soon|lorem/i)
    expect(text).not.toMatch(/years of experience|since \d{4}|\d+\+|founded/i)
    expect(text).not.toMatch(/built to last|\bfree\b/i)
  })

  it('define metadata sem "under construction"', async () => {
    const { metadata } = await import('./page')
    const description =
      'About CarShop — automotive upholstery, restoration and custom interior work.'

    expect(metadata.title).toBe('About')
    expect(metadata.description).toBe(description)
    expect(metadata.alternates?.canonical).toBe('http://localhost:3000/about')
    expect(metadata.openGraph).toMatchObject({ title: 'About', description })
    expect(JSON.stringify(metadata)).not.toMatch(/construction/i)
  })
})
