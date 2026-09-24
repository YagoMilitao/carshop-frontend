import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import type { Work, WorkImage } from '@/lib/api/works'

const getWorksMock = vi.fn<() => Promise<Work[]>>()
const toastErrorMock = vi.fn()

vi.mock('server-only', () => ({}))

// Mantém `getCoverImage` real: só a busca de rede é substituída.
vi.mock('@/lib/api/works', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api/works')>()

  return {
    ...actual,
    getWorks: () => getWorksMock(),
  }
})

vi.mock('sonner', () => ({
  toast: {
    error: (message: string) => toastErrorMock(message),
  },
}))

const INTRO = 'Upholstery, restoration and custom interior projects by CarShop.'
const ERROR_MESSAGE =
  "We couldn't load the portfolio right now. Please try again in a few moments."
const LEAD_SIZES =
  '(min-width: 1280px) 1120px, (min-width: 1024px) calc(100vw - 128px), 100vw'
const WIDE_SIZES =
  '(min-width: 1280px) 640px, (min-width: 1024px) 55vw, (min-width: 768px) 50vw, 100vw'
const NARROW_SIZES =
  '(min-width: 1280px) 450px, (min-width: 1024px) 40vw, (min-width: 768px) 50vw, 100vw'
const SOLO_SIZES = '(min-width: 1280px) 704px, (min-width: 1024px) 66vw, 100vw'

type Role = 'lead' | 'wide' | 'narrow' | 'solo'

const ROLE_EXPECTATIONS: Record<
  Role,
  { span: string[]; notSpan: string[]; frame: string[]; notFrame: string[]; sizes: string }
> = {
  lead: {
    span: ['md:col-span-2', 'lg:col-span-12'],
    notSpan: ['lg:col-span-7', 'lg:col-span-5', 'lg:col-span-8'],
    frame: ['aspect-4/3', 'md:aspect-video'],
    notFrame: ['lg:aspect-3/4'],
    sizes: LEAD_SIZES,
  },
  wide: {
    span: ['lg:col-span-7'],
    notSpan: ['md:col-span-2', 'lg:col-span-12', 'lg:col-span-5', 'lg:col-span-8'],
    frame: ['aspect-4/3'],
    notFrame: ['md:aspect-video', 'lg:aspect-3/4'],
    sizes: WIDE_SIZES,
  },
  narrow: {
    span: ['lg:col-span-5'],
    notSpan: ['md:col-span-2', 'lg:col-span-12', 'lg:col-span-7', 'lg:col-span-8'],
    frame: ['aspect-4/3', 'lg:aspect-3/4'],
    notFrame: ['md:aspect-video'],
    sizes: NARROW_SIZES,
  },
  solo: {
    span: ['md:col-span-2', 'lg:col-span-8'],
    notSpan: ['lg:col-span-12', 'lg:col-span-7', 'lg:col-span-5'],
    frame: ['aspect-4/3'],
    notFrame: ['md:aspect-video', 'lg:aspect-3/4'],
    sizes: SOLO_SIZES,
  },
}

const OLD_PT_BR_STRINGS =
  /Não foi possível|Tente novamente|Nenhum projeto publicado|Confira os projetos|Falha ao buscar/

function makeImage(id: string, options: { isCover?: boolean; order?: number } = {}): WorkImage {
  const { isCover = true, order = 0 } = options

  return {
    id,
    url: `https://res.cloudinary.com/demo/${id}.jpg`,
    publicId: id,
    alt: `Interior ${id}`,
    isCover,
    order,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
  }
}

function makeWork(id: string, images: WorkImage[] = [makeImage(`${id}-cover`)]): Work {
  return {
    id,
    slug: `work-${id}`,
    title: `Work ${id}`,
    description: `Description ${id}`,
    category: 'Estofamento',
    tags: ['tag'],
    images,
    status: 'published',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
    deletedAt: null,
  }
}

function makeWorks(count: number): Work[] {
  return Array.from({ length: count }, (_, index) => makeWork(String(index + 1)))
}

async function renderPortfolio() {
  const { default: PortfolioPage } = await import('./page')
  return render(await PortfolioPage())
}

describe('PortfolioPage', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renderiza h1 "Portfolio" e a introdução', async () => {
    getWorksMock.mockResolvedValue(makeWorks(1))
    await renderPortfolio()

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1, name: 'Portfolio' })).toBeInTheDocument()
    expect(screen.getByText(INTRO)).toBeInTheDocument()
  })

  it.each([1, 2, 3, 4, 5, 6])(
    'N=%i: um link e um h2 por work, apontando para /portfolio/[slug]',
    async (count) => {
      const works = makeWorks(count)
      getWorksMock.mockResolvedValue(works)
      await renderPortfolio()

      expect(screen.getAllByRole('link')).toHaveLength(count)
      expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(count)

      for (const work of works) {
        expect(screen.getByRole('link', { name: work.title })).toHaveAttribute(
          'href',
          `/portfolio/${work.slug}`,
        )
        expect(
          screen.getByRole('heading', { level: 2, name: work.title }),
        ).toBeInTheDocument()
      }
    },
  )

  it('preserva a ordem da API no DOM', async () => {
    getWorksMock.mockResolvedValue(makeWorks(5))
    await renderPortfolio()

    expect(screen.getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual([
      '/portfolio/work-1',
      '/portfolio/work-2',
      '/portfolio/work-3',
      '/portfolio/work-4',
      '/portfolio/work-5',
    ])
  })

  it('exibe categoria (como vem da API) e descrição apenas no lead', async () => {
    getWorksMock.mockResolvedValue(makeWorks(3))
    await renderPortfolio()

    expect(screen.getAllByText('Estofamento')).toHaveLength(3)
    expect(screen.getByText('Description 1')).toBeInTheDocument()
    expect(screen.queryByText('Description 2')).not.toBeInTheDocument()
    expect(screen.queryByText('tag')).not.toBeInTheDocument()
  })

  it('somente a primeira imagem é priority (não lazy), com sizes do lead', async () => {
    getWorksMock.mockResolvedValue(makeWorks(5))
    await renderPortfolio()

    const [first, ...rest] = screen.getAllByRole('img')

    expect(first).toHaveAttribute('alt', 'Interior 1-cover')
    expect(first).not.toHaveAttribute('loading', 'lazy')
    expect(first).toHaveAttribute('sizes', LEAD_SIZES)
    expect(rest).toHaveLength(4)
    for (const image of rest) {
      expect(image).toHaveAttribute('loading', 'lazy')
    }
  })

  it('nenhuma imagem é forçada a quadrado', async () => {
    getWorksMock.mockResolvedValue(makeWorks(4))
    await renderPortfolio()

    for (const image of screen.getAllByRole('img')) {
      expect(image.parentElement).not.toHaveClass('aspect-square')
    }
  })

  it('sem capa, usa a imagem de menor order', async () => {
    const work = makeWork('1', [
      makeImage('late', { isCover: false, order: 2 }),
      makeImage('early', { isCover: false, order: 1 }),
    ])
    getWorksMock.mockResolvedValue([work])
    await renderPortfolio()

    expect(screen.getByRole('img')).toHaveAttribute('alt', 'Interior early')
  })

  it('work sem imagens aparece como entrada somente texto, sem img', async () => {
    const textOnly = makeWork('2', [])
    getWorksMock.mockResolvedValue([makeWork('1'), textOnly])
    await renderPortfolio()

    const link = screen.getByRole('link', { name: 'Work 2' })
    expect(link).toHaveAttribute('href', '/portfolio/work-2')
    expect(within(link).queryByRole('img')).not.toBeInTheDocument()
    expect(within(link).getByRole('heading', { level: 2, name: 'Work 2' })).toBeInTheDocument()
    expect(within(link).getByText('Description 2')).toBeInTheDocument()
    expect(screen.getAllByRole('img')).toHaveLength(1)
  })

  it('somente works sem imagem: nenhuma img e todos os links presentes', async () => {
    getWorksMock.mockResolvedValue([makeWork('1', []), makeWork('2', [])])
    await renderPortfolio()

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.getAllByRole('link')).toHaveLength(2)
  })

  it.each<[number, Role[]]>([
    [1, ['lead']],
    [2, ['lead', 'solo']],
    [3, ['lead', 'wide', 'narrow']],
    [4, ['lead', 'wide', 'narrow', 'solo']],
    [5, ['lead', 'wide', 'narrow', 'narrow', 'wide']],
    [6, ['lead', 'wide', 'narrow', 'narrow', 'wide', 'solo']],
  ])('N=%i: span lg, proporção, sizes e lazy por papel (%j)', async (count, roles) => {
    const works = makeWorks(count)
    getWorksMock.mockResolvedValue(works)
    await renderPortfolio()

    works.forEach((work, index) => {
      const role = roles[index]
      const expected = ROLE_EXPECTATIONS[role]
      const link = screen.getByRole('link', { name: work.title })
      const item = link.closest('li')
      const image = within(link).getByRole('img')
      const frame = image.parentElement

      expect(item).toHaveClass(...expected.span)
      for (const className of expected.notSpan) {
        expect(item).not.toHaveClass(className)
      }
      expect(frame).toHaveClass(...expected.frame)
      for (const className of expected.notFrame) {
        expect(frame).not.toHaveClass(className)
      }
      expect(frame).not.toHaveClass('aspect-square')
      expect(image).toHaveAttribute('sizes', expected.sizes)
      if (role === 'lead') {
        expect(image).not.toHaveAttribute('loading', 'lazy')
      } else {
        expect(image).toHaveAttribute('loading', 'lazy')
      }
    })
  })

  it('grid único em <ul> com colunas responsivas e sem CSS order', async () => {
    getWorksMock.mockResolvedValue(makeWorks(5))
    const { container } = await renderPortfolio()

    const lists = container.querySelectorAll('ul')
    expect(lists).toHaveLength(1)
    expect(lists[0]).toHaveClass('grid', 'grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-12')
    expect(container.innerHTML).not.toMatch(/(^|\s|:)order-/)
  })

  it('somente o lead tem descrição e título text-heading-2; demais text-heading-3', async () => {
    getWorksMock.mockResolvedValue(makeWorks(4))
    await renderPortfolio()

    const headings = screen.getAllByRole('heading', { level: 2 })
    expect(headings[0]).toHaveClass('text-heading-2')
    for (const heading of headings.slice(1)) {
      expect(heading).toHaveClass('text-heading-3')
      expect(heading).not.toHaveClass('text-heading-2')
    }
    expect(screen.queryByRole('heading', { level: 3 })).not.toBeInTheDocument()
  })

  it('nenhuma classe aspect-square em toda a página (grid + entradas texto)', async () => {
    getWorksMock.mockResolvedValue([...makeWorks(6), makeWork('7', [])])
    const { container } = await renderPortfolio()

    expect(container.querySelector('.aspect-square')).toBeNull()
  })

  it('fallback de capa por menor order não muta work.images', async () => {
    const images = [
      makeImage('late', { isCover: false, order: 2 }),
      makeImage('early', { isCover: false, order: 1 }),
    ]
    const work = makeWork('1', images)
    getWorksMock.mockResolvedValue([work])
    await renderPortfolio()

    expect(work.images).toBe(images)
    expect(work.images.map((image) => image.id)).toEqual(['late', 'early'])
  })

  it('works sem imagem vão para uma lista tipográfica após o grid; papéis ignoram-nos', async () => {
    getWorksMock.mockResolvedValue([
      makeWork('1', []),
      makeWork('2'),
      makeWork('3'),
      makeWork('4', []),
    ])
    const { container } = await renderPortfolio()

    const lists = container.querySelectorAll('ul')
    expect(lists).toHaveLength(2)
    expect(within(lists[0]).getAllByRole('link').map((link) => link.getAttribute('aria-label'))).toEqual([
      'Work 2',
      'Work 3',
    ])
    expect(within(lists[1]).getAllByRole('link').map((link) => link.getAttribute('aria-label'))).toEqual([
      'Work 1',
      'Work 4',
    ])
    expect(within(lists[1]).queryByRole('img')).not.toBeInTheDocument()
    expect(within(lists[1]).queryByRole('heading', { level: 3 })).not.toBeInTheDocument()

    const lead = screen.getByRole('link', { name: 'Work 2' })
    expect(lead.closest('li')).toHaveClass('lg:col-span-12')
    expect(within(lead).getByRole('img')).not.toHaveAttribute('loading', 'lazy')
    expect(screen.getByRole('link', { name: 'Work 3' }).closest('li')).toHaveClass('lg:col-span-8')
  })

  it('entrada somente texto sem descrição não renderiza parágrafo vazio', async () => {
    const work = makeWork('1', [])
    work.description = ''
    getWorksMock.mockResolvedValue([work])
    await renderPortfolio()

    const link = screen.getByRole('link', { name: 'Work 1' })
    expect(link.querySelector('p')).toBeNull()
  })

  it('erro: toast + mensagem inline, sem links de projeto, com "Back to home"', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    getWorksMock.mockRejectedValue(new Error('backend unavailable'))
    await renderPortfolio()

    expect(
      screen.getByRole('heading', { level: 2, name: "We couldn't load the portfolio" }),
    ).toBeInTheDocument()
    expect(screen.getByText(ERROR_MESSAGE)).toBeInTheDocument()
    expect(toastErrorMock).toHaveBeenCalledWith(ERROR_MESSAGE)
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to fetch works for /portfolio:',
      expect.any(Error),
    )
    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(1)
    expect(screen.getByRole('link', { name: 'Back to home' })).toHaveAttribute('href', '/')
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(document.body.textContent).not.toMatch(OLD_PT_BR_STRINGS)
    expect(toastErrorMock).not.toHaveBeenCalledWith(expect.stringMatching(OLD_PT_BR_STRINGS))

    consoleErrorSpy.mockRestore()
  })

  it('vazio: mensagens em inglês + "Back to home", sem toast', async () => {
    getWorksMock.mockResolvedValue([])
    await renderPortfolio()

    expect(
      screen.getByRole('heading', { level: 2, name: 'No projects published yet' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Published projects will appear here.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to home' })).toHaveAttribute('href', '/')
    expect(toastErrorMock).not.toHaveBeenCalled()
    expect(document.body.textContent).not.toMatch(OLD_PT_BR_STRINGS)
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('metadata: title, canonical, OG title e nova description', async () => {
    const { metadata } = await import('./page')

    expect(metadata.title).toBe('Portfolio')
    expect(metadata.description).toBe(INTRO)
    expect(metadata.alternates?.canonical).toBe('http://localhost:3000/portfolio')
    expect(metadata.openGraph).toMatchObject({ title: 'Portfolio', description: INTRO })
    expect(JSON.stringify(metadata)).not.toMatch(OLD_PT_BR_STRINGS)
  })
})
