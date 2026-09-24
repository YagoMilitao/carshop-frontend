import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import type { Work, WorkImage } from '@/lib/api/works'
import type { ServiceCategory } from '../_lib/group-works-by-category'

vi.mock('server-only', () => ({}))

const { ServiceCategoryRow } = await import('./service-category-row')

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

function makeWork(id: string): Work {
  return {
    id,
    slug: `work-${id}`,
    title: `Work ${id}`,
    description: 'Descrição',
    category: 'Bancos',
    tags: [],
    images: [makeImage(`${id}-cover`)],
    status: 'published',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
    deletedAt: null,
  }
}

function makeCategory(count: number, options: { withPreview?: boolean; alt?: string } = {}): ServiceCategory {
  const { withPreview = true, alt } = options
  const works = Array.from({ length: count }, (_, index) => makeWork(String(index + 1)))

  return {
    key: 'bancos',
    label: 'Bancos',
    works,
    preview: withPreview ? { work: works[0], image: makeImage('1-cover', alt) } : null,
  }
}

describe('ServiceCategoryRow', () => {
  it('renderiza número decorativo, h2 com o label, contagem e links dos projetos', () => {
    const { container } = render(<ServiceCategoryRow category={makeCategory(2)} index={2} />)

    const number = screen.getByText('03')
    expect(number).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByRole('heading', { level: 2, name: 'Bancos' })).toBeInTheDocument()
    expect(screen.getByText('2 projects')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Work 1' })).toHaveAttribute('href', '/portfolio/work-1')
    expect(screen.getByRole('link', { name: 'Work 2' })).toHaveAttribute('href', '/portfolio/work-2')
    expect(screen.queryByRole('link', { name: 'View all projects' })).not.toBeInTheDocument()
    expect(container.querySelector('article')).toHaveAttribute(
      'aria-labelledby',
      'service-category-3',
    )
  })

  it('usa singular para um único projeto', () => {
    render(<ServiceCategoryRow category={makeCategory(1)} index={0} />)

    expect(screen.getByText('1 project')).toBeInTheDocument()
  })

  it('limita os links a 4 e adiciona "View all projects" quando há mais', () => {
    render(<ServiceCategoryRow category={makeCategory(6)} index={0} />)

    const list = screen.getByRole('list')
    expect(within(list).getAllByRole('link')).toHaveLength(4)
    expect(screen.getByRole('link', { name: 'View all projects' })).toHaveAttribute(
      'href',
      '/portfolio',
    )
  })

  it('com exatamente 4 projetos lista todos e não mostra "View all projects"', () => {
    render(<ServiceCategoryRow category={makeCategory(4)} index={0} />)

    const list = screen.getByRole('list')
    expect(within(list).getAllByRole('link')).toHaveLength(4)
    expect(screen.queryByRole('link', { name: 'View all projects' })).not.toBeInTheDocument()
  })

  it('renderiza foto não interativa com sizes e lazy por padrão', () => {
    render(<ServiceCategoryRow category={makeCategory(1)} index={0} />)

    const image = screen.getByRole('img')
    expect(image).toHaveAttribute('alt', 'Interior 1-cover')
    expect(image).toHaveAttribute('loading', 'lazy')
    expect(image).toHaveAttribute(
      'sizes',
      '(min-width: 1280px) 560px, (min-width: 1024px) 50vw, 100vw',
    )
    expect(image.closest('a')).toBeNull()
  })

  it('remove o lazy loading quando preload é true', () => {
    render(<ServiceCategoryRow category={makeCategory(1)} index={0} preload />)

    expect(screen.getByRole('img')).not.toHaveAttribute('loading', 'lazy')
  })

  it('usa o título do work como alt quando a imagem não tem alt', () => {
    render(<ServiceCategoryRow category={makeCategory(1, { alt: '' })} index={0} />)

    expect(screen.getByAltText('Work 1')).toBeInTheDocument()
  })

  it('sem foto: linha tipográfica ocupando 11 colunas', () => {
    render(<ServiceCategoryRow category={makeCategory(1, { withPreview: false })} index={0} />)

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2 }).parentElement).toHaveClass('lg:col-span-11')
  })
})
