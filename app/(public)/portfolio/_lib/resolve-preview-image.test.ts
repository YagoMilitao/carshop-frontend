import { describe, expect, it, vi } from 'vitest'
import type { Work, WorkImage } from '@/lib/api/works'

vi.mock('server-only', () => ({}))

import { resolvePreviewImage } from './resolve-preview-image'

function makeImage(id: string, order: number, isCover = false): WorkImage {
  return {
    id,
    url: `https://res.cloudinary.com/demo/${id}.jpg`,
    publicId: id,
    alt: `Interior ${id}`,
    isCover,
    order,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
  }
}

function makeWork(images: WorkImage[]): Work {
  return {
    id: '1',
    slug: 'work-1',
    title: 'Work 1',
    description: 'Description',
    category: 'Estofamento',
    tags: [],
    images,
    status: 'published',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
    deletedAt: null,
  }
}

describe('resolvePreviewImage', () => {
  it('prefere a imagem de capa, mesmo com order maior', () => {
    const cover = makeImage('cover', 5, true)
    const work = makeWork([makeImage('a', 0), cover])

    expect(resolvePreviewImage(work)).toBe(cover)
  })

  it('sem capa, usa a imagem de menor order', () => {
    const lowest = makeImage('b', 1)
    const work = makeWork([makeImage('a', 3), lowest, makeImage('c', 2)])

    expect(resolvePreviewImage(work)).toBe(lowest)
  })

  it('em empate de order, mantém a primeira do array', () => {
    const first = makeImage('a', 0)
    const work = makeWork([first, makeImage('b', 0)])

    expect(resolvePreviewImage(work)).toBe(first)
  })

  it('retorna null quando o work não tem imagens', () => {
    expect(resolvePreviewImage(makeWork([]))).toBeNull()
  })

  it('não altera a ordem de work.images', () => {
    const images = [makeImage('a', 3), makeImage('b', 1), makeImage('c', 2)]
    const work = makeWork(images)

    resolvePreviewImage(work)

    expect(work.images.map((image) => image.id)).toEqual(['a', 'b', 'c'])
    expect(work.images).toBe(images)
  })
})
