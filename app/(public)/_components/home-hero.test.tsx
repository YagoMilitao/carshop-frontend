import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import type { Work, WorkImage } from '@/lib/api/works'
import type { HomeHeroContent, HomeWork } from '../_lib/select-home-works'
import { HomeHero } from './home-hero'

function makeHero(alt = 'Interior em couro caramelo'): HomeHeroContent {
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
    id: '1',
    slug: 'bronco-1972',
    title: 'Bronco 1972',
    description: 'Descrição',
    category: 'interior completo',
    tags: [],
    images: [image],
    status: 'published',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
    deletedAt: null,
  }
  return { work, image }
}

function makeFeatured(
  id: string,
  overrides: Partial<Pick<WorkImage, 'url' | 'alt'>> = {},
): HomeWork {
  const image: WorkImage = {
    id: `img-${id}`,
    url: `https://res.cloudinary.com/demo/img-${id}.jpg`,
    publicId: `img-${id}`,
    alt: `Interior ${id}`,
    isCover: true,
    order: 0,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
    ...overrides,
  }
  const work: Work = {
    id,
    slug: `project-${id}`,
    title: `Project ${id}`,
    description: 'Descrição',
    category: `categoria ${id}`,
    tags: [],
    images: [image],
    status: 'published',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
    deletedAt: null,
  }

  return { work, image }
}

describe('HomeHero', () => {
  it('renderiza headline em h1, linha de serviços e CTAs', () => {
    render(<HomeHero hero={null} />)

    expect(
      screen.getByRole('heading', { level: 1, name: 'Crafted for your car. Built for the road.' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Upholstery · Restoration · Custom Work')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'View Our Work' })).toHaveAttribute(
      'href',
      '/portfolio',
    )
    expect(screen.getByRole('link', { name: 'Get a Quote' })).toHaveAttribute('href', '/#contact')
  })

  it('sem hero: versão tipográfica, sem imagem nem figura', () => {
    const { container } = render(<HomeHero hero={null} />)

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(container.querySelector('figure')).toBeNull()
    expect(container.querySelector('section')).toHaveAttribute(
      'aria-labelledby',
      'home-hero-heading',
    )
  })

  it('com hero: imagem com preload (não lazy) e sizes do hero', () => {
    render(<HomeHero hero={makeHero()} />)

    const image = screen.getByAltText('Interior em couro caramelo')
    expect(image).not.toHaveAttribute('loading', 'lazy')
    expect(image).toHaveAttribute(
      'sizes',
      '(min-width: 1280px) 660px, (min-width: 1024px) 55vw, 100vw',
    )
  })

  it('com hero: legenda com categoria e link para o detalhe do projeto', () => {
    render(<HomeHero hero={makeHero()} />)

    expect(screen.getByText('interior completo')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Bronco 1972' })).toHaveAttribute(
      'href',
      '/portfolio/bronco-1972',
    )
  })

  it('com hero sem alt: usa o título do work como alt', () => {
    render(<HomeHero hero={makeHero('')} />)

    expect(screen.getByAltText('Bronco 1972')).toBeInTheDocument()
  })

  it('com hero: wrapper 4:3 e figura com legenda quando o work é resolvido', () => {
    const { container } = render(<HomeHero hero={makeHero()} />)

    expect(container.querySelector('figure')).not.toBeNull()
    expect(container.querySelector('figcaption')).not.toBeNull()
    expect(container.querySelector('img')?.parentElement).toHaveClass('aspect-4/3')
  })

  describe('imagem configurada sem work resolvido', () => {
    const configured: HomeHeroContent = {
      image: { url: 'https://res.cloudinary.com/demo/home.jpg', alt: 'Banco bordado à mão' },
      work: null,
    }

    it('renderiza a imagem sem figura, legenda ou link do projeto', () => {
      const { container } = render(<HomeHero hero={configured} />)

      expect(screen.getByAltText('Banco bordado à mão')).toBeInTheDocument()
      expect(container.querySelector('figure')).toBeNull()
      expect(container.querySelector('figcaption')).toBeNull()
      expect(container.querySelector('a[href^="/portfolio/"]')).toBeNull()
    })

    it('mantém layout de duas colunas, preload e sizes', () => {
      const { container } = render(<HomeHero hero={configured} />)

      const image = container.querySelector('img')
      expect(image).not.toHaveAttribute('loading', 'lazy')
      expect(image).toHaveAttribute(
        'sizes',
        '(min-width: 1280px) 660px, (min-width: 1024px) 55vw, 100vw',
      )
      expect(image?.parentElement).toHaveClass('aspect-4/3')
      expect(container.querySelector('.lg\\:grid-cols-12')).not.toBeNull()
    })

    it('alt vazio sem work: imagem decorativa (alt="")', () => {
      const { container } = render(
        <HomeHero hero={{ ...configured, image: { ...configured.image, alt: '' } }} />,
      )

      const image = container.querySelector('img')
      expect(image).toHaveAttribute('alt', '')
      expect(screen.queryByRole('img')).not.toBeInTheDocument()
    })
  })

  it('alt configurado tem precedência sobre o título do work', () => {
    const hero = makeHero()
    render(<HomeHero hero={{ ...hero, image: { url: hero.image.url, alt: 'Alt do Admin' } }} />)

    expect(screen.getByAltText('Alt do Admin')).toBeInTheDocument()
    expect(screen.queryByAltText('Bronco 1972')).not.toBeInTheDocument()
  })

  describe('falha real no carregamento do asset remoto', () => {
    it('troca para a primeira capa elegível com alt, legenda, link e eager loading', () => {
      const configured: HomeHeroContent = {
        image: {
          url: 'https://res.cloudinary.com/demo/home.jpg',
          alt: 'Imagem configurada',
        },
        work: null,
      }
      const fallback = makeFeatured('2')

      render(<HomeHero hero={configured} featured={[fallback]} />)

      const primary = screen.getByAltText('Imagem configurada')
      expect(primary).not.toHaveAttribute('loading', 'lazy')

      fireEvent.error(primary)

      const recovered = screen.getByAltText('Interior 2')
      expect(recovered).toHaveAttribute('loading', 'eager')
      expect(screen.getByText('categoria 2')).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Project 2' })).toHaveAttribute(
        'href',
        '/portfolio/project-2',
      )
    })

    it('ignora URLs repetidas ou não permitidas e percorre os próximos candidatos', () => {
      const hero = makeHero()
      const duplicate = makeFeatured('2', { url: hero.image.url })
      const disallowed = makeFeatured('3', { url: 'https://cdn.example.com/img-3.jpg' })
      const firstEligible = makeFeatured('4')
      const secondEligible = makeFeatured('5')

      render(
        <HomeHero
          hero={hero}
          featured={[duplicate, disallowed, firstEligible, secondEligible]}
        />,
      )

      fireEvent.error(screen.getByAltText('Interior em couro caramelo'))
      expect(screen.getByAltText('Interior 4')).toBeInTheDocument()

      fireEvent.error(screen.getByAltText('Interior 4'))
      expect(screen.getByAltText('Interior 5')).toBeInTheDocument()
    })

    it('ao esgotar os candidatos remove mídia e legenda e mantém o Hero tipográfico', () => {
      const fallback = makeFeatured('2')
      const { container } = render(
        <HomeHero hero={makeHero()} featured={[fallback]} />,
      )

      fireEvent.error(screen.getByAltText('Interior em couro caramelo'))
      fireEvent.error(screen.getByAltText('Interior 2'))

      expect(container.querySelector('img')).toBeNull()
      expect(container.querySelector('figure')).toBeNull()
      expect(container.querySelector('figcaption')).toBeNull()
      expect(container.querySelector('.lg\\:grid-cols-12')).toBeNull()
      expect(
        screen.getByRole('heading', {
          level: 1,
          name: 'Crafted for your car. Built for the road.',
        }),
      ).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'View Our Work' })).toBeInTheDocument()
    })

    it('recupera uma falha concluída antes da hidratação', async () => {
      const completeSpy = vi
        .spyOn(HTMLImageElement.prototype, 'complete', 'get')
        .mockReturnValue(true)
      const currentSrcSpy = vi
        .spyOn(HTMLImageElement.prototype, 'currentSrc', 'get')
        .mockImplementation(function (this: HTMLImageElement) {
          return this.alt === 'Imagem configurada' ? this.src : ''
        })
      const naturalWidthSpy = vi
        .spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get')
        .mockImplementation(function (this: HTMLImageElement) {
          return this.alt === 'Imagem configurada' ? 0 : 640
        })

      try {
        render(
          <HomeHero
            hero={{
              image: {
                url: 'https://res.cloudinary.com/demo/home.jpg',
                alt: 'Imagem configurada',
              },
              work: null,
            }}
            featured={[makeFeatured('2')]}
          />,
        )

        expect(await screen.findByAltText('Interior 2')).toBeInTheDocument()
      } finally {
        completeSpy.mockRestore()
        currentSrcSpy.mockRestore()
        naturalWidthSpy.mockRestore()
      }
    })
  })

  describe('workTarget (CARSHOP-165)', () => {
    it('sem workTarget, "View Our Work" mantém /portfolio', () => {
      render(<HomeHero hero={null} />)

      expect(screen.getByRole('link', { name: 'View Our Work' })).toHaveAttribute(
        'href',
        '/portfolio',
      )
    })

    it.each([
      ['portfolio', '/portfolio'],
      ['home-section', '/#our-work'],
    ] as const)('workTarget="%s" → "View Our Work" aponta para %s', (workTarget, href) => {
      render(<HomeHero hero={makeHero()} featured={[makeFeatured('2')]} workTarget={workTarget} />)

      expect(screen.getByRole('link', { name: 'View Our Work' })).toHaveAttribute('href', href)
      expect(screen.getByRole('link', { name: 'Get a Quote' })).toHaveAttribute(
        'href',
        '/#contact',
      )
    })
  })
})
