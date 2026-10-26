import { describe, expect, it } from 'vitest'
import type { Comment } from '@/lib/api/comments'
import type { Work } from '@/lib/api/works'
import {
  HOME_REVIEWS_LIMIT,
  HOME_REVIEWS_WORKS_LIMIT,
  selectHomeReviews,
} from './select-home-reviews'

function makeWork(id: string): Work {
  return {
    id,
    slug: `work-${id}`,
    title: `Work ${id}`,
    description: 'Descrição',
    category: 'bancos',
    tags: [],
    images: [],
    status: 'published',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
    deletedAt: null,
  }
}

function makeComment(id: string, overrides: Partial<Comment> = {}): Comment {
  return {
    id,
    workId: '1',
    authorName: 'Yago Militão',
    content: `Comentário ${id}`,
    status: 'APPROVED',
    createdAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-06-01T00:00:00.000Z',
    ...overrides,
  }
}

const works = [makeWork('1'), makeWork('2')]

describe('selectHomeReviews', () => {
  it('expõe os limites aprovados', () => {
    expect(HOME_REVIEWS_WORKS_LIMIT).toBe(6)
    expect(HOME_REVIEWS_LIMIT).toBe(3)
  })

  it('mapeia para HomeReview sem authorName/workId/status/updatedAt', () => {
    const [review] = selectHomeReviews([makeComment('c1', { workId: '2' })], works)

    expect(review).toEqual({
      id: 'c1',
      content: 'Comentário c1',
      reviewerName: 'Yago M.',
      createdAt: '2026-06-01T00:00:00.000Z',
      work: { title: 'Work 2', slug: 'work-2' },
    })
    expect(review).not.toHaveProperty('authorName')
    expect(review).not.toHaveProperty('workId')
    expect(review).not.toHaveProperty('status')
    expect(review).not.toHaveProperty('updatedAt')
  })

  it('descarta comentários que não estão APPROVED', () => {
    const result = selectHomeReviews(
      [
        makeComment('pending', { status: 'PENDING' }),
        makeComment('hidden', { status: 'HIDDEN' }),
        makeComment('ok'),
      ],
      works,
    )

    expect(result.map((review) => review.id)).toEqual(['ok'])
  })

  it('descarta conteúdo vazio/whitespace e remove espaços nas pontas', () => {
    const result = selectHomeReviews(
      [
        makeComment('empty', { content: '' }),
        makeComment('blank', { content: '  \n\t ' }),
        makeComment('ok', { content: '  Great work\nThanks  ' }),
      ],
      works,
    )

    expect(result).toHaveLength(1)
    expect(result[0]?.content).toBe('Great work\nThanks')
  })

  it('descarta createdAt inválido', () => {
    const result = selectHomeReviews(
      [makeComment('bad', { createdAt: 'not-a-date' }), makeComment('ok')],
      works,
    )

    expect(result.map((review) => review.id)).toEqual(['ok'])
  })

  it('descarta quando o nome derivado é vazio', () => {
    const result = selectHomeReviews(
      [makeComment('noname', { authorName: '   ' }), makeComment('ok')],
      works,
    )

    expect(result.map((review) => review.id)).toEqual(['ok'])
  })

  it('descarta comentários cujo work não está na listagem', () => {
    const result = selectHomeReviews(
      [makeComment('orphan', { workId: 'removido' }), makeComment('ok')],
      works,
    )

    expect(result.map((review) => review.id)).toEqual(['ok'])
  })

  it('remove duplicados por id (mantém a primeira ocorrência válida)', () => {
    const result = selectHomeReviews(
      [
        makeComment('dup', { content: 'Primeiro' }),
        makeComment('dup', { content: 'Segundo' }),
      ],
      works,
    )

    expect(result).toHaveLength(1)
    expect(result[0]?.content).toBe('Primeiro')
  })

  it('ordena por createdAt desc com desempate por id asc e limita a 3', () => {
    const result = selectHomeReviews(
      [
        makeComment('old', { createdAt: '2026-01-01T00:00:00.000Z' }),
        makeComment('b', { createdAt: '2026-05-01T00:00:00.000Z' }),
        makeComment('newest', { createdAt: '2026-06-10T00:00:00.000Z', workId: '2' }),
        makeComment('a', { createdAt: '2026-05-01T00:00:00.000Z' }),
        makeComment('older', { createdAt: '2026-02-01T00:00:00.000Z' }),
      ],
      works,
    )

    expect(result.map((review) => review.id)).toEqual(['newest', 'a', 'b'])
  })

  it('desempate por id asc independe da ordem de entrada', () => {
    const sameDate = { createdAt: '2026-05-01T00:00:00.000Z' }
    const ascending = selectHomeReviews(
      [makeComment('a', sameDate), makeComment('b', sameDate), makeComment('c', sameDate)],
      works,
    )
    const descending = selectHomeReviews(
      [makeComment('c', sameDate), makeComment('b', sameDate), makeComment('a', sameDate)],
      works,
    )

    expect(ascending.map((review) => review.id)).toEqual(['a', 'b', 'c'])
    expect(descending.map((review) => review.id)).toEqual(['a', 'b', 'c'])
  })

  it('sem comentários → lista vazia', () => {
    expect(selectHomeReviews([], works)).toEqual([])
    expect(selectHomeReviews([makeComment('c1')], [])).toEqual([])
  })
})
