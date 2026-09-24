import { describe, expect, it, vi } from 'vitest'
import type { Work, WorkImage } from '@/lib/api/works'

vi.mock('server-only', () => ({}))

const { selectAboutImage } = await import('./select-about-image')

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

function makeWork(id: string, images: WorkImage[]): Work {
  return {
    id,
    slug: `work-${id}`,
    title: `Work ${id}`,
    description: 'Descrição',
    category: 'bancos',
    tags: [],
    images,
    status: 'published',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
    deletedAt: null,
  }
}

describe('selectAboutImage', () => {
  it('retorna o primeiro work (ordem da API) que tem imagem', () => {
    const works = [
      makeWork('1', []),
      makeWork('2', [makeImage('2-a', false)]),
      makeWork('3', [makeImage('3-cover', true)]),
    ]

    const result = selectAboutImage(works)

    expect(result?.work.id).toBe('2')
    expect(result?.image.id).toBe('2-a')
  })

  it('prefere a capa dentro do work selecionado', () => {
    const result = selectAboutImage([
      makeWork('1', [makeImage('1-a', false), makeImage('1-cover', true)]),
    ])

    expect(result?.image.id).toBe('1-cover')
  })

  it('retorna null quando nenhum work tem imagem', () => {
    expect(selectAboutImage([makeWork('1', []), makeWork('2', [])])).toBeNull()
  })

  it('retorna null para lista vazia', () => {
    expect(selectAboutImage([])).toBeNull()
  })

  it('não muta a entrada', () => {
    const works = Object.freeze([
      makeWork('1', []),
      makeWork('2', [makeImage('2-a', false)]),
    ])
    const snapshot = JSON.stringify(works)

    selectAboutImage(works)

    expect(JSON.stringify(works)).toBe(snapshot)
  })
})
