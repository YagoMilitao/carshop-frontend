import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { Work, WorkImage } from '@/lib/api/works'
import type { HomeHeroContent } from '../_lib/select-home-works'
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
    expect(screen.getByRole('button', { name: 'Get a Quote (coming soon)' })).toBeDisabled()
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
})
