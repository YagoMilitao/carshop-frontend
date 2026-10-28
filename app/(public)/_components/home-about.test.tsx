import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import type { Work, WorkImage } from '@/lib/api/works'
import type { HomeWork } from '../_lib/select-home-works'
import { HOME_ABOUT_CONTENT, HomeAbout, type HomeAboutContent } from './home-about'

function makeItem(alt = 'Interior detail'): HomeWork {
  const image: WorkImage = {
    id: 'img-1',
    url: 'https://res.cloudinary.com/demo/img-1.jpg',
    publicId: 'img-1',
    alt,
    isCover: true,
    order: 0,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
  }
  const work: Work = {
    id: '5',
    slug: 'work-5',
    title: 'Work 5',
    description: 'Descrição',
    category: 'bancos',
    tags: [],
    images: [image],
    status: 'published',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
    deletedAt: null,
  }

  return { work, image }
}

function getSection(container: HTMLElement): HTMLElement {
  const section = container.querySelector<HTMLElement>('section#about')
  if (!section) throw new Error('section#about não encontrada')
  return section
}

describe('HomeAbout', () => {
  it('renderiza section#about associada ao heading via aria-labelledby', () => {
    const { container } = render(<HomeAbout image={null} />)
    const section = getSection(container)

    expect(section).toHaveAttribute('aria-labelledby', 'home-about-heading')
    expect(within(section).getByRole('heading', { level: 2 })).toHaveAttribute(
      'id',
      'home-about-heading',
    )
  })

  it('tem exatamente um h2 com o heading aprovado e nenhum h1/h3', () => {
    render(<HomeAbout image={null} />)

    const headings = screen.getAllByRole('heading')
    expect(headings).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      HOME_ABOUT_CONTENT.heading,
    )
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 3 })).not.toBeInTheDocument()
  })

  it('renderiza a narrativa e os diferenciais aprovados, sem descrições', () => {
    render(<HomeAbout image={null} />)

    expect(screen.getByText(HOME_ABOUT_CONTENT.narrative)).toBeInTheDocument()

    const items = within(screen.getByRole('list')).getAllByRole('listitem')
    expect(items).toHaveLength(HOME_ABOUT_CONTENT.differentiators.length)
    expect(items.length).toBeGreaterThanOrEqual(2)
    expect(items.length).toBeLessThanOrEqual(4)
    expect(items.map((item) => item.textContent)).toEqual(
      HOME_ABOUT_CONTENT.differentiators.map((item) => item.title),
    )
    for (const item of items) {
      expect(item.querySelectorAll('p')).toHaveLength(1)
    }
  })

  it('renderiza a descrição apenas quando presente', () => {
    const content: HomeAboutContent = {
      heading: 'Heading',
      narrative: 'Narrative',
      differentiators: [
        { title: 'With description', description: 'One-line description' },
        { title: 'Title only' },
      ],
    }
    render(<HomeAbout image={null} content={content} />)

    const [withDescription, titleOnly] = within(screen.getByRole('list')).getAllByRole(
      'listitem',
    )
    expect(withDescription?.querySelectorAll('p')).toHaveLength(2)
    expect(withDescription).toHaveTextContent('One-line description')
    expect(titleOnly?.querySelectorAll('p')).toHaveLength(1)
  })

  it('com imagem: figure com foto lazy, sizes, categoria e link para o projeto', () => {
    const { container } = render(<HomeAbout image={makeItem()} />)
    const section = getSection(container)

    const figure = section.querySelector('figure')
    expect(figure).not.toBeNull()
    if (!figure) return

    const image = within(figure).getByRole('img')
    expect(image).toHaveAttribute('alt', 'Interior detail')
    expect(image).toHaveAttribute('loading', 'lazy')
    expect(image).toHaveAttribute(
      'sizes',
      '(min-width: 1280px) 544px, (min-width: 1024px) 50vw, 100vw',
    )

    const caption = figure.querySelector('figcaption')
    expect(caption).not.toBeNull()
    if (!caption) return
    expect(within(caption).getByText('bancos')).toBeInTheDocument()
    const link = within(caption).getByRole('link', { name: 'Work 5' })
    expect(link).toHaveAttribute('href', '/portfolio/work-5')
    // A foto não fica dentro do link.
    expect(link.querySelector('img')).toBeNull()
  })

  it('com imagem sem alt: usa o título do work como alt', () => {
    render(<HomeAbout image={makeItem('')} />)

    expect(screen.getByRole('img')).toHaveAttribute('alt', 'Work 5')
  })

  it('sem imagem: seção presente, sem img, figure ou link de portfolio', () => {
    const { container } = render(<HomeAbout image={null} />)
    const section = getSection(container)

    expect(section.querySelector('img')).toBeNull()
    expect(section.querySelector('figure')).toBeNull()
    expect(section.querySelector('a[href^="/portfolio/"]')).toBeNull()
  })

  it('não exibe estatísticas nem CTA próprio', () => {
    const { container } = render(<HomeAbout image={makeItem()} />)
    const text = container.textContent ?? ''

    expect(text).not.toMatch(/\d+\+|%|years of experience/i)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.getAllByRole('link')).toHaveLength(1)
  })

  it('copy do constante corresponde literalmente à copy aprovada pelo usuário', () => {
    // Guarda contra paráfrase: a copy aprovada (CARSHOP-169) deve ser usada verbatim.
    expect(HOME_ABOUT_CONTENT).toEqual({
      heading: 'Hello, we are DreamUP',
      narrative:
        'We take care of interior upholstery — your auto interior restoration dream is our reality.',
      differentiators: [
        { title: 'Friendly as can be' },
        { title: 'Fair pricing' },
        { title: 'Quick turnaround' },
        { title: 'High quality' },
      ],
    })
  })

  it('expõe a seção como landmark region nomeada pelo heading', () => {
    render(<HomeAbout image={null} />)

    expect(
      screen.getByRole('region', { name: HOME_ABOUT_CONTENT.heading }),
    ).toHaveAttribute('id', 'about')
  })

  it('com imagem: figure acessível, ícone decorativo oculto e link com alvo de toque/foco', () => {
    render(<HomeAbout image={makeItem()} />)

    const figure = screen.getByRole('figure')
    const link = within(figure).getByRole('link', { name: 'Work 5' })
    expect(link).toHaveClass('min-h-11', 'focus-visible:ring-3', 'focus-visible:ring-focus-ring')
    const icon = link.querySelector('svg')
    expect(icon).not.toBeNull()
    expect(icon).toHaveAttribute('aria-hidden', 'true')

    const image = within(figure).getByRole('img')
    expect(image).not.toHaveAttribute('fetchpriority', 'high')
    expect(image).toHaveAttribute('loading', 'lazy')
  })

  it('layout com imagem: texto e lista à esquerda, figure à direita em duas linhas', () => {
    const { container } = render(<HomeAbout image={makeItem()} />)
    const section = getSection(container)

    const heading = within(section).getByRole('heading', { level: 2 })
    const textBlock = heading.parentElement
    const grid = textBlock?.parentElement
    const figure = section.querySelector('figure')
    const list = within(section).getByRole('list')

    expect(grid).toHaveClass('grid', 'lg:grid-cols-12', 'lg:grid-rows-[auto_1fr]')
    expect(textBlock).toHaveClass('lg:col-span-5', 'lg:col-start-1', 'lg:row-start-1')
    expect(figure).toHaveClass(
      'lg:col-span-6',
      'lg:col-start-7',
      'lg:row-span-2',
      'lg:row-start-1',
    )
    expect(list).toHaveClass('lg:col-span-5', 'lg:col-start-1', 'lg:row-start-2')
    expect(list).not.toHaveClass('lg:col-start-7')

    // Ordem do DOM (leitura no mobile): texto → figure → lista.
    expect(Array.from(grid?.children ?? [])).toEqual([textBlock, figure, list])
  })

  it('layout sem imagem: texto à esquerda e lista à direita, sem linhas explícitas', () => {
    const { container } = render(<HomeAbout image={null} />)
    const section = getSection(container)

    const heading = within(section).getByRole('heading', { level: 2 })
    const textBlock = heading.parentElement
    const grid = textBlock?.parentElement
    const list = within(section).getByRole('list')

    expect(grid).toHaveClass('grid', 'lg:grid-cols-12')
    expect(grid).not.toHaveClass('lg:grid-rows-[auto_1fr]')
    expect(textBlock).toHaveClass('lg:col-span-5')
    expect(textBlock).not.toHaveClass('lg:row-start-1')
    expect(list).toHaveClass('lg:col-span-6', 'lg:col-start-7')
    expect(list).not.toHaveClass('lg:row-start-2')
    expect(Array.from(grid?.children ?? [])).toEqual([textBlock, list])
  })

  it('apresentação editorial: divisores finos na lista, sem cards nem badges', () => {
    const { container } = render(<HomeAbout image={makeItem()} />)
    const section = getSection(container)

    expect(section).toHaveClass('border-t', 'border-border')
    expect(within(section).getByRole('list')).toHaveClass('divide-y', 'divide-border')
    expect(section.querySelector('[class*="shadow"]')).toBeNull()
    expect(section.querySelector('[data-slot="card"], [data-slot="badge"]')).toBeNull()
  })
})
