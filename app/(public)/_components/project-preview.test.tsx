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

describe('ProjectPreview', () => {
  it('é um link para o detalhe do projeto, rotulado pelo título', () => {
    render(<ProjectPreview item={makeItem()} emphasis="dominant" />)

    expect(screen.getByRole('link', { name: 'Mustang 1967' })).toHaveAttribute(
      'href',
      '/portfolio/mustang-1967',
    )
  })

  it('exibe categoria (como vem da API) e título em h3', () => {
    render(<ProjectPreview item={makeItem()} emphasis="supporting" />)

    expect(screen.getByText('bancos')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Mustang 1967' })).toBeInTheDocument()
  })

  it('usa sizes de destaque para emphasis="dominant"', () => {
    render(<ProjectPreview item={makeItem()} emphasis="dominant" />)

    expect(screen.getByRole('img')).toHaveAttribute(
      'sizes',
      '(min-width: 1280px) 750px, (min-width: 1024px) 66vw, 100vw',
    )
  })

  it('usa sizes de apoio para emphasis="supporting"', () => {
    render(<ProjectPreview item={makeItem()} emphasis="supporting" />)

    expect(screen.getByRole('img')).toHaveAttribute(
      'sizes',
      '(min-width: 1280px) 370px, (min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw',
    )
  })

  it('usa o alt da imagem e carrega de forma lazy', () => {
    render(<ProjectPreview item={makeItem()} emphasis="dominant" />)

    const image = screen.getByAltText('Banco de couro restaurado')
    expect(image).toHaveAttribute('loading', 'lazy')
  })

  it('usa o título do work como alt quando a imagem não tem alt', () => {
    render(<ProjectPreview item={makeItem('')} emphasis="supporting" />)

    expect(screen.getByAltText('Mustang 1967')).toBeInTheDocument()
  })
})
