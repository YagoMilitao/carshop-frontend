import { describe, expect, it, vi } from 'vitest'
import type { Work, WorkImage } from '@/lib/api/works'

vi.mock('server-only', () => ({}))

import { buildPortfolioLayout } from './build-portfolio-layout'

function makeImage(id: string, isCover: boolean): WorkImage {
  return {
    id,
    url: `https://res.cloudinary.com/demo/${id}.jpg`,
    publicId: id,
    alt: `Interior ${id}`,
    isCover,
    order: 0,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
  }
}

function makeWork(id: string, images: 'cover' | 'noCover' | 'none' = 'cover'): Work {
  return {
    id,
    slug: `work-${id}`,
    title: `Work ${id}`,
    description: 'Description',
    category: 'Estofamento',
    tags: [],
    images: images === 'none' ? [] : [makeImage(`${id}-img`, images === 'cover')],
    status: 'published',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
    deletedAt: null,
  }
}

function makeWorks(count: number): Work[] {
  return Array.from({ length: count }, (_, index) => makeWork(String(index + 1)))
}

function roles(count: number) {
  return buildPortfolioLayout(makeWorks(count)).entries.map((entry) => entry.role)
}

describe('buildPortfolioLayout', () => {
  it.each([
    [0, []],
    [1, ['lead']],
    [2, ['lead', 'solo']],
    [3, ['lead', 'wide', 'narrow']],
    [4, ['lead', 'wide', 'narrow', 'solo']],
    [5, ['lead', 'wide', 'narrow', 'narrow', 'wide']],
    [6, ['lead', 'wide', 'narrow', 'narrow', 'wide', 'solo']],
  ])('N=%i → %j', (count, expected) => {
    expect(roles(count)).toEqual(expected)
  })

  it('alterna os pares 7/5 ↔ 5/7 em listas longas', () => {
    expect(roles(9)).toEqual([
      'lead',
      'wide',
      'narrow',
      'narrow',
      'wide',
      'wide',
      'narrow',
      'narrow',
      'wide',
    ])
  })

  it('preserva a ordem da API', () => {
    const { entries } = buildPortfolioLayout(makeWorks(5))

    expect(entries.map((entry) => entry.item.work.id)).toEqual(['1', '2', '3', '4', '5'])
  })

  it('usa a imagem resolvida (fallback por order) quando não há capa', () => {
    const work = makeWork('1', 'noCover')
    const { entries } = buildPortfolioLayout([work])

    expect(entries[0]?.item.image).toBe(work.images[0])
  })

  it('separa works sem imagem em textOnly, sem afetar os papéis', () => {
    const works = [
      makeWork('1', 'none'),
      makeWork('2'),
      makeWork('3', 'none'),
      makeWork('4'),
    ]
    const { entries, textOnly } = buildPortfolioLayout(works)

    expect(entries.map((entry) => [entry.item.work.id, entry.role])).toEqual([
      ['2', 'lead'],
      ['4', 'solo'],
    ])
    expect(textOnly.map((work) => work.id)).toEqual(['1', '3'])
  })

  it('somente works sem imagem → nenhum entry', () => {
    const { entries, textOnly } = buildPortfolioLayout([makeWork('1', 'none')])

    expect(entries).toEqual([])
    expect(textOnly).toHaveLength(1)
  })
})
