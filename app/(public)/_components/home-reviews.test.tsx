import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import type { HomeReview } from '../_lib/select-home-reviews'
import { HomeReviews } from './home-reviews'

function makeReview(id: string, overrides: Partial<HomeReview> = {}): HomeReview {
  return {
    id,
    content: `Excellent seats ${id}`,
    reviewerName: 'Yago M.',
    createdAt: '2026-06-05T12:00:00.000Z',
    work: { title: `Mustang ${id}`, slug: `mustang-${id}` },
    ...overrides,
  }
}

describe('HomeReviews', () => {
  it('lista vazia → não renderiza nada (sem âncora #reviews)', () => {
    const { container } = render(<HomeReviews reviews={[]} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('renderiza a seção #reviews rotulada pelo heading "Reviews"', () => {
    const { container } = render(<HomeReviews reviews={[makeReview('1')]} />)

    const section = container.querySelector('section')
    expect(section).toHaveAttribute('id', 'reviews')
    expect(section).toHaveAttribute('aria-labelledby', 'reviews-heading')
    expect(screen.getByRole('region', { name: 'Reviews' })).toBe(section)
    expect(screen.getByRole('heading', { level: 2, name: 'Reviews' })).toHaveAttribute(
      'id',
      'reviews-heading',
    )
  })

  it('renderiza cada review em lista com figure/blockquote/figcaption', () => {
    const { container } = render(
      <HomeReviews reviews={[makeReview('1'), makeReview('2'), makeReview('3')]} />,
    )

    const items = within(screen.getByRole('list')).getAllByRole('listitem')
    expect(items).toHaveLength(3)
    expect(container.querySelectorAll('figure blockquote')).toHaveLength(3)
    expect(container.querySelectorAll('figure figcaption')).toHaveLength(3)
    expect(screen.getByText('Excellent seats 1')).toBeInTheDocument()
  })

  it('renderiza conteúdo com HTML/script como texto', () => {
    const malicious = '<script>alert("x")</script><img src=x onerror=alert(1)>'
    const { container } = render(
      <HomeReviews reviews={[makeReview('1', { content: malicious })]} />,
    )

    expect(container.querySelector('script')).toBeNull()
    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('blockquote p')).toHaveTextContent(malicious)
  })

  it('exibe apenas o nome abreviado recebido', () => {
    render(<HomeReviews reviews={[makeReview('1', { reviewerName: 'Ana S.' })]} />)

    expect(screen.getByText('Ana S.')).toBeInTheDocument()
  })

  it('usa <time dateTime> com data longa en-US', () => {
    const { container } = render(<HomeReviews reviews={[makeReview('1')]} />)

    const time = container.querySelector('time')
    expect(time).toHaveAttribute('dateTime', '2026-06-05T12:00:00.000Z')
    expect(time).toHaveTextContent('June 5, 2026')
  })

  it('link para /portfolio/{slug} com nome acessível igual ao título do work', () => {
    render(<HomeReviews reviews={[makeReview('1')]} />)

    expect(screen.getByRole('link', { name: 'Mustang 1' })).toHaveAttribute(
      'href',
      '/portfolio/mustang-1',
    )
  })

  it('não exibe estrelas, médias, contadores, avatares nem imagens', () => {
    const { container } = render(
      <HomeReviews reviews={[makeReview('1'), makeReview('2')]} />,
    )
    const text = container.textContent ?? ''

    expect(text).not.toMatch(/[★☆⭐]/u)
    expect(text).not.toMatch(/\d+(\.\d+)?\s*\/\s*5|\bstars?\b|\brating\b/i)
    expect(text).not.toMatch(/\d+\s+reviews?/i)
    expect(text).not.toMatch(/[“”"]/u)
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })
})
