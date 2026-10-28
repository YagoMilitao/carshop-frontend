import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import type { Comment } from '@/lib/api/comments'
import type { HomeImage } from '@/lib/api/home-image'
import type { SocialLink } from '@/lib/social-links'
import type { Work, WorkImage } from '@/lib/api/works'

const getWorksMock = vi.fn<() => Promise<Work[]>>()
const getHomeImageMock = vi.fn<() => Promise<HomeImage | null>>()
const getWorkCommentsMock = vi.fn<(workId: string) => Promise<Comment[]>>()
const toastErrorMock = vi.fn()
const getSocialLinksMock = vi.fn<() => SocialLink[]>()

vi.mock('server-only', () => ({}))

vi.mock('@/lib/api/works', () => ({
  getWorks: () => getWorksMock(),
  getCoverImage: (work: Work) => work.images.find((image) => image.isCover),
}))

vi.mock('@/lib/api/home-image.server', () => ({
  getHomeImage: () => getHomeImageMock(),
}))

vi.mock('@/lib/social-links', () => ({
  getSocialLinks: () => getSocialLinksMock(),
}))

vi.mock('@/lib/api/comments', () => ({
  getWorkComments: (workId: string) => getWorkCommentsMock(workId),
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

function getServicesSection(): HTMLElement | null {
  return document.querySelector<HTMLElement>('section#services')
}

function getContactSection(): HTMLElement | null {
  return document.querySelector<HTMLElement>('section#contact')
}

function expectDegradedHome() {
  expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  const services = getServicesSection()
  expect(services).not.toBeNull()
  if (!services) return
  expect(services).toHaveAttribute('aria-labelledby', 'services-heading')
  expect(screen.getByRole('heading', { level: 2, name: 'Services' })).toBeInTheDocument()
  expect(within(services).getByRole('link', { name: 'Contact CarShop' })).toHaveAttribute(
    'href',
    '/#contact',
  )
  const contact = getContactSection()
  expect(contact).not.toBeNull()
  expect(contact).toHaveAttribute('aria-labelledby', 'home-contact-heading')
  expect(screen.queryByText('Project categories')).not.toBeInTheDocument()
  expect(screen.queryByRole('list', { name: 'Project categories' })).not.toBeInTheDocument()
  expect(
    screen.getByRole('heading', { level: 2, name: 'Ready to transform your interior?' }),
  ).toBeInTheDocument()
  expect(screen.queryByRole('img')).not.toBeInTheDocument()
  expect(screen.queryByRole('heading', { name: 'Our Work' })).not.toBeInTheDocument()
  expect(screen.queryByRole('link', { name: 'View all projects' })).not.toBeInTheDocument()
  expect(toastErrorMock).not.toHaveBeenCalled()
}

describe('HomePage (public)', () => {
  beforeEach(() => {
    getHomeImageMock.mockResolvedValue(null)
    getWorkCommentsMock.mockResolvedValue([])
    getSocialLinksMock.mockReturnValue([])
  })

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

    it('renderiza os CTAs: "View Our Work" para /portfolio e "Get a Quote" (Hero) para /#contact', async () => {
      getWorksMock.mockResolvedValue(works)
      await renderHome()

      const viewOurWork = screen.getAllByRole('link', { name: 'View Our Work' })
      expect(viewOurWork).toHaveLength(2)
      for (const link of viewOurWork) {
        expect(link).toHaveAttribute('href', '/portfolio')
      }

      // Só o Hero exibe "Get a Quote"; dentro de `#contact` ele é omitido.
      const quoteLinks = screen.getAllByRole('link', { name: 'Get a Quote' })
      expect(quoteLinks).toHaveLength(1)
      expect(quoteLinks[0]).toHaveAttribute('href', '/#contact')
      expect(screen.queryByRole('button', { name: /get a quote/i })).not.toBeInTheDocument()
      const contact = getContactSection()
      expect(contact).not.toBeNull()
      if (!contact) return
      expect(within(contact).queryByRole('link', { name: 'Get a Quote' })).not.toBeInTheDocument()
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
      expect(labelledBy).toEqual([
        'home-hero-heading',
        'services-heading',
        'our-work-heading',
        'home-contact-heading',
      ])
    })

    it('renderiza #services logo após o Hero, com pilares, categorias reais e CTA para /#contact', async () => {
      getWorksMock.mockResolvedValue(works)
      await renderHome()

      const section = getServicesSection()
      expect(section).not.toBeNull()
      if (!section) return

      const scoped = within(section)
      expect(scoped.getByRole('heading', { level: 2, name: 'Services' })).toBeInTheDocument()
      for (const pillar of ['Upholstery', 'Restoration', 'Custom Work']) {
        expect(scoped.getByText(pillar)).toBeInTheDocument()
      }
      const evidence = scoped.getByRole('list', { name: 'Project categories' })
      expect(within(evidence).getAllByRole('listitem').map((item) => item.textContent)).toEqual([
        'bancos',
      ])
      expect(scoped.getByRole('link', { name: 'Contact CarShop' })).toHaveAttribute(
        'href',
        '/#contact',
      )
      expect(section.querySelector('img')).toBeNull()
      expect(getWorksMock).toHaveBeenCalledTimes(1)
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

  it('com lista vazia: Hero tipográfico e #contact, sem imagens nem "Our Work"', async () => {
    getWorksMock.mockResolvedValue([])
    await renderHome()

    expectDegradedHome()
    expect(getWorksMock).toHaveBeenCalledTimes(1)
  })

  it('quando getWorks() falha: degrada silenciosamente e registra console.error', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    getWorksMock.mockRejectedValue(new Error('backend indisponível'))
    await renderHome()

    expectDegradedHome()
    expect(consoleErrorSpy).toHaveBeenCalled()
    expect(getWorksMock).toHaveBeenCalledTimes(1)
  })

  it('#services usa as categorias reais da API, na ordem recebida, limitadas a 6', async () => {
    const categories = ['bancos', 'Teto solar', 'volantes', 'portas', 'painel', 'tapetes', 'capotas']
    getWorksMock.mockResolvedValue(
      categories.map((category, index) => ({ ...makeWork(String(index + 1)), category })),
    )
    await renderHome()

    const section = getServicesSection()
    expect(section).not.toBeNull()
    if (!section) return
    const evidence = within(section).getByRole('list', { name: 'Project categories' })
    expect(
      within(evidence)
        .getAllByRole('listitem')
        .map((item) => item.textContent?.replace('·', '')),
    ).toEqual(categories.slice(0, 6))
    expect(getWorksMock).toHaveBeenCalledTimes(1)
  })

  it('#services exibe categorias mesmo quando nenhum work tem capa (evidência não depende de imagem)', async () => {
    getWorksMock.mockResolvedValue([
      { ...makeWork('1', { hasCover: false }), category: 'bancos' },
      { ...makeWork('2', { hasCover: false }), category: 'Bancos' },
      { ...makeWork('3', { hasCover: false }), category: 'volantes' },
    ])
    await renderHome()

    const section = getServicesSection()
    expect(section).not.toBeNull()
    if (!section) return
    const evidence = within(section).getByRole('list', { name: 'Project categories' })
    expect(
      within(evidence)
        .getAllByRole('listitem')
        .map((item) => item.textContent?.replace('·', '')),
    ).toEqual(['bancos', 'volantes'])
    expect(section.querySelector('img')).toBeNull()
  })

  describe('#contact (CARSHOP-171)', () => {
    it('é a última seção, sempre presente, com "Contact CarShop" para /contact', async () => {
      getWorksMock.mockResolvedValue([])
      const { container } = await renderHome()

      const sections = Array.from(container.querySelectorAll('section'))
      const contact = getContactSection()
      expect(contact).not.toBeNull()
      if (!contact) return
      expect(sections.at(-1)).toBe(contact)
      expect(contact).toHaveAttribute('tabindex', '-1')
      expect(within(contact).getByRole('link', { name: 'Contact CarShop' })).toHaveAttribute(
        'href',
        '/contact',
      )
      expect(within(contact).queryByRole('list')).not.toBeInTheDocument()
      expect(getSocialLinksMock).toHaveBeenCalledTimes(1)
    })

    it('com links sociais configurados: exibe "Follow CarShop" (h3) dentro de #contact', async () => {
      getWorksMock.mockResolvedValue([])
      getSocialLinksMock.mockReturnValue([
        { href: 'https://instagram.com/example', label: 'Instagram' },
      ])
      await renderHome()

      const contact = getContactSection()
      expect(contact).not.toBeNull()
      if (!contact) return
      expect(
        within(contact).getByRole('heading', { level: 3, name: 'Follow CarShop' }),
      ).toBeInTheDocument()
      expect(
        within(contact).getByRole('link', { name: 'Instagram (opens in a new tab)' }),
      ).toHaveAttribute('href', 'https://instagram.com/example')
    })

    it('cria uma única âncora #contact, sem #quote, e não publica dados de contato inventados', async () => {
      getWorksMock.mockResolvedValue([makeWork('1'), makeWork('2')])
      getSocialLinksMock.mockReturnValue([
        { href: 'https://instagram.com/example', label: 'Instagram' },
      ])
      const { container } = await renderHome()

      expect(container.querySelectorAll('#contact')).toHaveLength(1)
      expect(container.querySelector('#quote')).toBeNull()
      expect(container.querySelector('a[href*="#quote"]')).toBeNull()
      expect(container.querySelector('a[href^="tel:"]')).toBeNull()
      expect(container.querySelector('a[href^="mailto:"]')).toBeNull()
      expect(container.querySelector('form')).toBeNull()
      expect(container.textContent ?? '').not.toMatch(/coming soon/i)

      // Todo link para a âncora usa o caminho absoluto `/#contact`.
      const anchorLinks = Array.from(
        container.querySelectorAll<HTMLAnchorElement>('a[href*="#contact"]'),
      )
      expect(anchorLinks.length).toBeGreaterThan(0)
      for (const link of anchorLinks) {
        expect(link).toHaveAttribute('href', '/#contact')
      }
    })
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

  describe('com imagem principal configurada no Admin (GET /home-image)', () => {
    const works = ['1', '2', '3', '4', '5'].map((id) => makeWork(id))
    const homeImage: HomeImage = {
      workId: '3',
      imageId: 'home-img',
      url: 'https://res.cloudinary.com/demo/home.jpg',
      alt: 'Imagem escolhida no Admin',
    }

    function getOurWorkHrefs(): (string | null)[] {
      const section = screen
        .getByRole('heading', { level: 2, name: 'Our Work' })
        .closest('section')
      if (!section) return []

      return within(section)
        .getAllByRole('link')
        .map((link) => link.getAttribute('href'))
        .filter((href) => href?.startsWith('/portfolio/'))
    }

    it('usa a imagem configurada como Hero (única não lazy) com legenda do work resolvido', async () => {
      getWorksMock.mockResolvedValue(works)
      getHomeImageMock.mockResolvedValue(homeImage)
      const { container } = await renderHome()

      const preloaded = screen
        .getAllByRole('img')
        .filter((image) => image.getAttribute('loading') !== 'lazy')
      expect(preloaded).toHaveLength(1)
      expect(preloaded[0]).toHaveAttribute('alt', 'Imagem escolhida no Admin')

      const heroSection = container.querySelector<HTMLElement>('section[aria-labelledby="home-hero-heading"]')
      expect(heroSection).not.toBeNull()
      if (!heroSection) return
      expect(within(heroSection).getByRole('link', { name: 'Work 3' })).toHaveAttribute(
        'href',
        '/portfolio/work-3',
      )
    })

    it('usa a primeira capa de featured quando o asset configurado falha no navegador', async () => {
      getWorksMock.mockResolvedValue(works)
      getHomeImageMock.mockResolvedValue(homeImage)
      const { container } = await renderHome()

      fireEvent.error(screen.getByAltText('Imagem escolhida no Admin'))

      const heroSection = container.querySelector<HTMLElement>(
        'section[aria-labelledby="home-hero-heading"]',
      )
      expect(heroSection).not.toBeNull()
      if (!heroSection) return

      const fallback = within(heroSection).getByAltText('Interior 1-cover')
      expect(fallback).toHaveAttribute('loading', 'eager')
      expect(within(heroSection).getByRole('link', { name: 'Work 1' })).toHaveAttribute(
        'href',
        '/portfolio/work-1',
      )
    })

    it('não repete o work de origem em "Our Work"', async () => {
      getWorksMock.mockResolvedValue(works)
      getHomeImageMock.mockResolvedValue(homeImage)
      await renderHome()

      expect(getOurWorkHrefs()).toEqual([
        '/portfolio/work-1',
        '/portfolio/work-2',
        '/portfolio/work-4',
      ])
    })

    it('imagem null: Hero é a capa do primeiro work (comportamento atual)', async () => {
      getWorksMock.mockResolvedValue(works)
      getHomeImageMock.mockResolvedValue(null)
      await renderHome()

      expect(screen.getByAltText('Interior 1-cover')).not.toHaveAttribute('loading', 'lazy')
      expect(getOurWorkHrefs()).toEqual([
        '/portfolio/work-2',
        '/portfolio/work-3',
        '/portfolio/work-4',
      ])
    })

    it('getHomeImage() falha: fallback, console.error e nenhum toast', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      getWorksMock.mockResolvedValue(works)
      getHomeImageMock.mockRejectedValue(new Error('429'))
      await renderHome()

      expect(screen.getByAltText('Interior 1-cover')).not.toHaveAttribute('loading', 'lazy')
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Falha ao buscar a imagem principal da Home:',
        expect.any(Error),
      )
      expect(toastErrorMock).not.toHaveBeenCalled()
    })

    it('getHomeImage() falha: #services mantém as categorias reais (degradação independente)', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {})
      getWorksMock.mockResolvedValue(works)
      getHomeImageMock.mockRejectedValue(new Error('429'))
      await renderHome()

      const section = document.querySelector<HTMLElement>('section#services')
      expect(section).not.toBeNull()
      if (!section) return
      const evidence = within(section).getByRole('list', { name: 'Project categories' })
      expect(within(evidence).getAllByRole('listitem').map((item) => item.textContent)).toEqual([
        'bancos',
      ])
    })

    it('ambas as chamadas falham: Home degradada com um console.error por falha', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      getWorksMock.mockRejectedValue(new Error('works off'))
      getHomeImageMock.mockRejectedValue(new Error('home-image off'))
      await renderHome()

      expectDegradedHome()
      expect(consoleErrorSpy).toHaveBeenCalledTimes(2)
    })

    it('works falha e imagem configurada: Hero com imagem, sem legenda nem "Our Work"', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {})
      getWorksMock.mockRejectedValue(new Error('works off'))
      getHomeImageMock.mockResolvedValue(homeImage)
      const { container } = await renderHome()

      expect(screen.getAllByRole('img')).toHaveLength(1)
      expect(screen.getByAltText('Imagem escolhida no Admin')).toBeInTheDocument()
      expect(container.querySelector('figcaption')).toBeNull()
      expect(container.querySelector('a[href^="/portfolio/"]')).toBeNull()
      expect(screen.queryByRole('heading', { name: 'Our Work' })).not.toBeInTheDocument()
    })

    it('alt vazio com work resolvido: usa o título do work como alt', async () => {
      getWorksMock.mockResolvedValue(works)
      getHomeImageMock.mockResolvedValue({ ...homeImage, alt: '' })
      await renderHome()

      const preloaded = screen
        .getAllByRole('img')
        .filter((image) => image.getAttribute('loading') !== 'lazy')
      expect(preloaded).toHaveLength(1)
      expect(preloaded[0]).toHaveAttribute('alt', 'Work 3')
      expect(preloaded[0]).toHaveAttribute('src', expect.stringContaining('home.jpg'))
    })

    it('alt vazio com work não resolvido: imagem decorativa, sem legenda', async () => {
      getWorksMock.mockResolvedValue(works)
      getHomeImageMock.mockResolvedValue({ ...homeImage, workId: 'removido', alt: '' })
      const { container } = await renderHome()

      const heroSection = container.querySelector<HTMLElement>(
        'section[aria-labelledby="home-hero-heading"]',
      )
      expect(heroSection).not.toBeNull()
      if (!heroSection) return
      const heroImage = heroSection.querySelector('img')
      expect(heroImage).toHaveAttribute('alt', '')
      expect(heroImage).toHaveAttribute('src', expect.stringContaining('home.jpg'))
      expect(heroSection.querySelector('figure')).toBeNull()
      expect(heroSection.querySelector('a[href^="/portfolio/"]')).toBeNull()
      expect(getOurWorkHrefs()).toEqual([
        '/portfolio/work-1',
        '/portfolio/work-2',
        '/portfolio/work-3',
      ])
    })

    it('host não permitido: fallback para a capa do primeiro work', async () => {
      getWorksMock.mockResolvedValue(works)
      getHomeImageMock.mockResolvedValue({ ...homeImage, url: 'https://cdn.example.com/home.jpg' })
      await renderHome()

      expect(screen.queryByAltText('Imagem escolhida no Admin')).not.toBeInTheDocument()
      expect(screen.getByAltText('Interior 1-cover')).not.toHaveAttribute('loading', 'lazy')
    })
  })

  describe('#reviews (comentários aprovados, CARSHOP-170)', () => {
    const works = ['1', '2', '3', '4', '5'].map((id) => makeWork(id))

    function makeComment(id: string, workId: string, createdAt: string): Comment {
      return {
        id,
        workId,
        authorName: 'Yago Militão',
        content: `Great job ${id}`,
        status: 'APPROVED',
        createdAt,
        updatedAt: createdAt,
      }
    }

    function getReviewsSection(container: HTMLElement): HTMLElement | null {
      return container.querySelector<HTMLElement>('section#reviews')
    }

    it('com reviews: renderiza #reviews entre "Our Work" e o CTA final', async () => {
      getWorksMock.mockResolvedValue(works)
      getWorkCommentsMock.mockImplementation(async (workId) =>
        workId === '2' ? [makeComment('c1', '2', '2026-06-05T12:00:00.000Z')] : [],
      )
      const { container } = await renderHome()

      const labelledBy = Array.from(container.querySelectorAll('section')).map((section) =>
        section.getAttribute('aria-labelledby'),
      )
      expect(labelledBy).toEqual([
        'home-hero-heading',
        'services-heading',
        'our-work-heading',
        'reviews-heading',
        'home-contact-heading',
      ])

      const section = getReviewsSection(container)
      expect(section).not.toBeNull()
      if (!section) return
      const scoped = within(section)
      expect(scoped.getByRole('heading', { level: 2, name: 'Reviews' })).toBeInTheDocument()
      expect(scoped.getByText('Great job c1')).toBeInTheDocument()
      expect(scoped.getByText('Yago M.')).toBeInTheDocument()
      expect(section.textContent).not.toContain('Militão')
      expect(scoped.getByRole('link', { name: 'Work 2' })).toHaveAttribute(
        'href',
        '/portfolio/work-2',
      )
    })

    it('limita o fan-out aos 6 primeiros works e exibe no máximo 3 reviews', async () => {
      const manyWorks = ['1', '2', '3', '4', '5', '6', '7', '8'].map((id) => makeWork(id))
      getWorksMock.mockResolvedValue(manyWorks)
      getWorkCommentsMock.mockImplementation(async (workId) => [
        makeComment(`c-${workId}`, workId, `2026-0${workId}-01T00:00:00.000Z`),
      ])
      const { container } = await renderHome()

      expect(getWorkCommentsMock).toHaveBeenCalledTimes(6)
      const section = getReviewsSection(container)
      expect(section).not.toBeNull()
      if (!section) return
      expect(within(section).getAllByRole('listitem')).toHaveLength(3)
      expect(section.textContent).toContain('Great job c-6')
      expect(section.textContent).not.toContain('Great job c-7')
    })

    it('sem comentários aprovados: #reviews ausente e restante da Home intacto', async () => {
      getWorksMock.mockResolvedValue(works)
      const { container } = await renderHome()

      expect(getReviewsSection(container)).toBeNull()
      expect(screen.queryByRole('heading', { name: 'Reviews' })).not.toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 2, name: 'Our Work' })).toBeInTheDocument()
    })

    it('falha parcial: exibe os reviews dos works que responderam', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      getWorksMock.mockResolvedValue(works)
      getWorkCommentsMock.mockImplementation(async (workId) => {
        if (workId === '1') throw new Error('429')
        return workId === '3' ? [makeComment('c3', '3', '2026-06-01T00:00:00.000Z')] : []
      })
      const { container } = await renderHome()

      const section = getReviewsSection(container)
      expect(section).not.toBeNull()
      expect(section?.textContent).toContain('Great job c3')
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      expect(toastErrorMock).not.toHaveBeenCalled()
    })

    it('falha total: #reviews ausente, Home renderiza e nenhum toast', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {})
      getWorksMock.mockResolvedValue(works)
      getWorkCommentsMock.mockRejectedValue(new Error('backend off'))
      const { container } = await renderHome()

      expect(getReviewsSection(container)).toBeNull()
      expect(screen.getByRole('heading', { level: 2, name: 'Our Work' })).toBeInTheDocument()
      expect(toastErrorMock).not.toHaveBeenCalled()
    })

    it('getWorks() falha: nenhum fan-out e #reviews ausente', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {})
      getWorksMock.mockRejectedValue(new Error('works off'))
      const { container } = await renderHome()

      expect(getWorkCommentsMock).not.toHaveBeenCalled()
      expect(getReviewsSection(container)).toBeNull()
      expectDegradedHome()
    })

    it('#reviews renderiza mesmo quando "Our Work" é omitida', async () => {
      const noCover = [makeWork('1', { hasCover: false })]
      getWorksMock.mockResolvedValue(noCover)
      getWorkCommentsMock.mockResolvedValue([
        makeComment('c1', '1', '2026-06-01T00:00:00.000Z'),
      ])
      const { container } = await renderHome()

      expect(screen.queryByRole('heading', { name: 'Our Work' })).not.toBeInTheDocument()
      const labelledBy = Array.from(container.querySelectorAll('section')).map((section) =>
        section.getAttribute('aria-labelledby'),
      )
      expect(labelledBy).toEqual([
        'home-hero-heading',
        'services-heading',
        'reviews-heading',
        'home-contact-heading',
      ])
    })
  })
})
