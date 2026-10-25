import { describe, expect, it, vi } from 'vitest'
import type { HomeImage } from '@/lib/api/home-image'
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

function makeHomeImage(overrides: Partial<HomeImage> = {}): HomeImage {
  return {
    workId: '2',
    imageId: 'home-img',
    url: 'https://res.cloudinary.com/demo/home.jpg',
    alt: 'Alt configurado',
    ...overrides,
  }
}

describe('selectHomeWorks', () => {
  it('preserva a ordem da API: hero é o primeiro e featured os seguintes', () => {
    const result = selectHomeWorks([makeWork('3'), makeWork('1'), makeWork('2')])

    expect(result.hero?.work?.id).toBe('3')
    expect(ids(result.featured)).toEqual(['1', '2'])
  })

  it('associa a imagem de capa (isCover) a cada work selecionado', () => {
    const result = selectHomeWorks([makeWork('1')])

    expect(result.hero?.image).toEqual(
      expect.objectContaining({ url: 'https://res.cloudinary.com/demo/1-cover.jpg' }),
    )
  })

  it('pula works sem imagem de capa', () => {
    const result = selectHomeWorks([
      makeWork('1', false),
      makeWork('2'),
      makeWork('3', false),
      makeWork('4'),
    ])

    expect(result.hero?.work?.id).toBe('2')
    expect(ids(result.featured)).toEqual(['4'])
  })

  it('limita featured a 3 itens', () => {
    const result = selectHomeWorks(['1', '2', '3', '4', '5', '6'].map((id) => makeWork(id)))

    expect(ids(result.featured)).toEqual(['2', '3', '4'])
  })

  it('nunca repete o hero em featured', () => {
    const result = selectHomeWorks(['1', '2', '3', '4'].map((id) => makeWork(id)))

    expect(ids(result.featured)).not.toContain(result.hero?.work?.id)
  })

  it('retorna hero nulo e featured vazio para lista vazia', () => {
    expect(selectHomeWorks([])).toEqual({ hero: null, featured: [] })
  })

  it('retorna hero nulo quando nenhum work tem capa', () => {
    expect(selectHomeWorks([makeWork('1', false)])).toEqual({ hero: null, featured: [] })
  })

  it('com um único work com capa: hero definido e featured vazio', () => {
    const result = selectHomeWorks([makeWork('1')])

    expect(result.hero?.work?.id).toBe('1')
    expect(result.featured).toEqual([])
  })

  it('sem imagem configurada (null explícito) mantém o comportamento atual', () => {
    const works = ['1', '2', '3'].map((id) => makeWork(id))

    expect(selectHomeWorks(works, null)).toEqual(selectHomeWorks(works))
    expect(selectHomeWorks(works, null).hero?.work?.id).toBe('1')
  })

  describe('com imagem configurada no Admin', () => {
    it('usa a imagem configurada e resolve o work de origem por workId', () => {
      const works = ['1', '2', '3', '4', '5'].map((id) => makeWork(id))
      const result = selectHomeWorks(works, makeHomeImage({ workId: '2' }))

      expect(result.hero).toEqual({
        image: { url: 'https://res.cloudinary.com/demo/home.jpg', alt: 'Alt configurado' },
        work: works[1],
      })
    })

    it('exclui o work de origem de featured e começa pelo índice 0', () => {
      const works = ['1', '2', '3', '4', '5'].map((id) => makeWork(id))
      const result = selectHomeWorks(works, makeHomeImage({ workId: '2' }))

      expect(ids(result.featured)).toEqual(['1', '3', '4'])
    })

    it('work de origem é o primeiro da API: featured começa pelo índice 0 sem ele', () => {
      const works = ['1', '2', '3', '4', '5'].map((id) => makeWork(id))
      const result = selectHomeWorks(works, makeHomeImage({ workId: '1' }))

      expect(result.hero?.work?.id).toBe('1')
      expect(ids(result.featured)).toEqual(['2', '3', '4'])
    })

    it('http em res.cloudinary.com: cai no fallback', () => {
      const works = ['1', '2'].map((id) => makeWork(id))
      const result = selectHomeWorks(
        works,
        makeHomeImage({ workId: '2', url: 'http://res.cloudinary.com/demo/home.jpg' }),
      )

      expect(result).toEqual(selectHomeWorks(works))
    })

    it('work não resolvido: hero com work nulo e featured inalterado a partir do índice 0', () => {
      const works = ['1', '2', '3', '4'].map((id) => makeWork(id))
      const result = selectHomeWorks(works, makeHomeImage({ workId: 'desconhecido' }))

      expect(result.hero?.work).toBeNull()
      expect(result.hero?.image.url).toBe('https://res.cloudinary.com/demo/home.jpg')
      expect(ids(result.featured)).toEqual(['1', '2', '3'])
    })

    it('resolve o work de origem mesmo quando ele não tem capa', () => {
      const works = [makeWork('1'), makeWork('2', false), makeWork('3')]
      const result = selectHomeWorks(works, makeHomeImage({ workId: '2' }))

      expect(result.hero?.work?.id).toBe('2')
      expect(ids(result.featured)).toEqual(['1', '3'])
    })

    it('com lista de works vazia: hero da imagem configurada sem work', () => {
      expect(selectHomeWorks([], makeHomeImage())).toEqual({
        hero: { image: { url: 'https://res.cloudinary.com/demo/home.jpg', alt: 'Alt configurado' }, work: null },
        featured: [],
      })
    })

    it('preserva alt vazio da imagem configurada', () => {
      const result = selectHomeWorks([makeWork('2')], makeHomeImage({ alt: '' }))

      expect(result.hero?.image.alt).toBe('')
    })

    it('host não permitido: cai no fallback (primeiro work com capa)', () => {
      const works = ['1', '2', '3'].map((id) => makeWork(id))
      const result = selectHomeWorks(
        works,
        makeHomeImage({ workId: '2', url: 'https://cdn.example.com/home.jpg' }),
      )

      expect(result).toEqual(selectHomeWorks(works))
      expect(result.hero?.work?.id).toBe('1')
    })
  })
})
