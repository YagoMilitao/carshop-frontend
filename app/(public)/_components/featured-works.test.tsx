import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import type { Work, WorkImage } from '@/lib/api/works'
import type { HomeWork } from '../_lib/select-home-works'
import { FeaturedWorks } from './featured-works'

const DOMINANT_SIZES = '(min-width: 1280px) 750px, (min-width: 1024px) 66vw, 100vw'
const SUPPORTING_SIZES =
  '(min-width: 1280px) 370px, (min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw'

function makeItem(id: string): HomeWork {
  const image: WorkImage = {
    id: `${id}-cover`,
    url: `https://res.cloudinary.com/demo/${id}.jpg`,
    publicId: id,
    alt: `Interior ${id}`,
    isCover: true,
    order: 0,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
  }
  const work: Work = {
    id,
    slug: `work-${id}`,
    title: `Work ${id}`,
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

describe('FeaturedWorks', () => {
  it('não renderiza nada quando a lista está vazia', () => {
    const { container } = render(<FeaturedWorks featured={[]} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('com 1 item: somente o dominante, sem lista de apoio', () => {
    render(<FeaturedWorks featured={[makeItem('1')]} />)

    expect(screen.getByRole('heading', { level: 2, name: 'Our Work' })).toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Work 1' })).toHaveAttribute(
      'href',
      '/portfolio/work-1',
    )
    expect(screen.getByAltText('Interior 1')).toHaveAttribute('sizes', DOMINANT_SIZES)
  })

  it('com 2 itens: dominante fora da lista e 1 item de apoio', () => {
    render(<FeaturedWorks featured={[makeItem('1'), makeItem('2')]} />)

    const list = screen.getByRole('list')
    const items = within(list).getAllByRole('listitem')
    expect(items).toHaveLength(1)
    expect(within(list).getByRole('link', { name: 'Work 2' })).toHaveAttribute(
      'href',
      '/portfolio/work-2',
    )
    expect(within(list).queryByRole('link', { name: 'Work 1' })).not.toBeInTheDocument()
    expect(screen.getByAltText('Interior 1')).toHaveAttribute('sizes', DOMINANT_SIZES)
    expect(screen.getByAltText('Interior 2')).toHaveAttribute('sizes', SUPPORTING_SIZES)
  })

  it('com 3 itens: dominante + 2 de apoio, na ordem recebida', () => {
    render(<FeaturedWorks featured={[makeItem('1'), makeItem('2'), makeItem('3')]} />)

    const list = screen.getByRole('list')
    const supportingLinks = within(list).getAllByRole('link')
    expect(supportingLinks.map((link) => link.getAttribute('href'))).toEqual([
      '/portfolio/work-2',
      '/portfolio/work-3',
    ])
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual([
      'Work 1',
      'Work 2',
      'Work 3',
    ])
    expect(screen.getByAltText('Interior 3')).toHaveAttribute('sizes', SUPPORTING_SIZES)
  })

  it('todas as imagens de "Our Work" são lazy (sem priority)', () => {
    render(<FeaturedWorks featured={[makeItem('1'), makeItem('2'), makeItem('3')]} />)

    for (const image of screen.getAllByRole('img')) {
      expect(image).toHaveAttribute('loading', 'lazy')
    }
  })

  it('exibe "View all projects" apontando para /portfolio e rotula a seção', () => {
    const { container } = render(<FeaturedWorks featured={[makeItem('1')]} />)

    expect(screen.getByRole('link', { name: 'View all projects' })).toHaveAttribute(
      'href',
      '/portfolio',
    )
    expect(container.querySelector('section')).toHaveAttribute(
      'aria-labelledby',
      'our-work-heading',
    )
  })
})
