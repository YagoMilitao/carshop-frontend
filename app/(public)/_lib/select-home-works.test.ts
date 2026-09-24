import { describe, expect, it, vi } from 'vitest'
import type { Work, WorkImage } from '@/lib/api/works'

vi.mock('server-only', () => ({}))

const { selectHomeWorks } = await import('./select-home-works')

function makeImage(id: string, isCover: boolean): WorkImage {
  return {
    id,
    url: `https://res.cloudinary.com/demo/${id}.jpg`,
    publicId: id,
    alt: `Alt ${id}`,
    isCover,
    order: 0,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
  }
}

function makeWork(id: string, hasCover = true): Work {
  return {
    id,
    slug: `work-${id}`,
    title: `Work ${id}`,
    description: 'Descrição',
    category: 'bancos',
    tags: [],
    images: [makeImage(`${id}-a`, false), makeImage(`${id}-cover`, hasCover)],
    status: 'published',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
    deletedAt: null,
  }
}

const ids = (items: { work: Work }[]) => items.map((item) => item.work.id)

describe('selectHomeWorks', () => {
  it('preserva a ordem da API: hero é o primeiro e featured os seguintes', () => {
    const result = selectHomeWorks([makeWork('3'), makeWork('1'), makeWork('2')])

    expect(result.hero?.work.id).toBe('3')
    expect(ids(result.featured)).toEqual(['1', '2'])
  })

  it('associa a imagem de capa (isCover) a cada work selecionado', () => {
    const result = selectHomeWorks([makeWork('1')])

    expect(result.hero?.image.id).toBe('1-cover')
  })

  it('pula works sem imagem de capa', () => {
    const result = selectHomeWorks([
      makeWork('1', false),
      makeWork('2'),
      makeWork('3', false),
      makeWork('4'),
    ])

    expect(result.hero?.work.id).toBe('2')
    expect(ids(result.featured)).toEqual(['4'])
  })

  it('limita featured a 3 itens', () => {
    const result = selectHomeWorks(['1', '2', '3', '4', '5', '6'].map((id) => makeWork(id)))

    expect(ids(result.featured)).toEqual(['2', '3', '4'])
  })

  it('nunca repete o hero em featured', () => {
    const result = selectHomeWorks(['1', '2', '3', '4'].map((id) => makeWork(id)))

    expect(ids(result.featured)).not.toContain(result.hero?.work.id)
  })

  it('retorna hero nulo e featured vazio para lista vazia', () => {
    expect(selectHomeWorks([])).toEqual({ hero: null, featured: [] })
  })

  it('retorna hero nulo quando nenhum work tem capa', () => {
    expect(selectHomeWorks([makeWork('1', false)])).toEqual({ hero: null, featured: [] })
  })

  it('com um único work com capa: hero definido e featured vazio', () => {
    const result = selectHomeWorks([makeWork('1')])

    expect(result.hero?.work.id).toBe('1')
    expect(result.featured).toEqual([])
  })
})
