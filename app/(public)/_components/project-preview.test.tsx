import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { Work, WorkImage } from '@/lib/api/works'
import { ProjectPreview } from './project-preview'

function makeItem(alt = 'Banco de couro restaurado') {
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
    slug: 'mustang-1967',
    title: 'Mustang 1967',
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

const SIZES = '(min-width: 1280px) 750px, (min-width: 1024px) 66vw, 100vw'

function imageFrame() {
  const frame = screen.getByRole('img').parentElement

  if (!frame) {
    throw new Error('imagem sem contêiner')
  }

  return frame
}

describe('ProjectPreview', () => {
  it('é um link para o detalhe do projeto, rotulado pelo título', () => {
    render(<ProjectPreview item={makeItem()} sizes={SIZES} />)

    expect(screen.getByRole('link', { name: 'Mustang 1967' })).toHaveAttribute(
      'href',
      '/portfolio/mustang-1967',
    )
  })

  it('por padrão exibe categoria (como vem da API) e título em h3, sem descrição', () => {
    render(<ProjectPreview item={makeItem()} sizes={SIZES} />)

    expect(screen.getByText('bancos')).toBeInTheDocument()
    const heading = screen.getByRole('heading', { level: 3, name: 'Mustang 1967' })
    expect(heading).toHaveClass('text-heading-3')
    expect(screen.queryByText('Descrição')).not.toBeInTheDocument()
  })

  it('renderiza o título em h2 quando headingLevel=2', () => {
    render(<ProjectPreview item={makeItem()} sizes={SIZES} headingLevel={2} />)

    expect(screen.getByRole('heading', { level: 2, name: 'Mustang 1967' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 3 })).not.toBeInTheDocument()
  })

  it('repassa sizes para a imagem', () => {
    render(<ProjectPreview item={makeItem()} sizes={SIZES} />)

    expect(screen.getByRole('img')).toHaveAttribute('sizes', SIZES)
  })

  it('frame padrão (editorial) usa 4:3', () => {
    render(<ProjectPreview item={makeItem()} sizes={SIZES} />)

    expect(imageFrame()).toHaveClass('aspect-4/3')
    expect(imageFrame()).not.toHaveClass('aspect-square')
  })

  it('frame="banner" usa 4:3 no mobile e 16:9 a partir de md', () => {
    render(<ProjectPreview item={makeItem()} sizes={SIZES} frame="banner" />)

    expect(imageFrame()).toHaveClass('aspect-4/3', 'md:aspect-video')
  })

  it('frame="detail" usa 4:3 e 3:4 a partir de lg', () => {
    render(<ProjectPreview item={makeItem()} sizes={SIZES} frame="detail" />)

    expect(imageFrame()).toHaveClass('aspect-4/3', 'lg:aspect-3/4')
  })

  it('lead: título em text-heading-2 e descrição real', () => {
    render(<ProjectPreview item={makeItem()} sizes={SIZES} headingLevel={2} lead />)

    expect(screen.getByRole('heading', { level: 2, name: 'Mustang 1967' })).toHaveClass(
      'text-heading-2',
    )
    expect(screen.getByText('Descrição')).toHaveClass('line-clamp-3')
  })

  it('lead sem descrição não renderiza parágrafo vazio', () => {
    const item = makeItem()
    item.work.description = ''
    const { container } = render(<ProjectPreview item={item} sizes={SIZES} lead />)

    expect(container.querySelector('p')).toBeNull()
  })

  it('carrega de forma lazy por padrão', () => {
    render(<ProjectPreview item={makeItem()} sizes={SIZES} />)

    expect(screen.getByAltText('Banco de couro restaurado')).toHaveAttribute('loading', 'lazy')
  })

  it('não é lazy quando priority=true', () => {
    render(<ProjectPreview item={makeItem()} sizes={SIZES} priority />)

    expect(screen.getByRole('img')).not.toHaveAttribute('loading', 'lazy')
  })

  it('usa o título do work como alt quando a imagem não tem alt', () => {
    render(<ProjectPreview item={makeItem('')} sizes={SIZES} />)

    expect(screen.getByAltText('Mustang 1967')).toBeInTheDocument()
  })
})
