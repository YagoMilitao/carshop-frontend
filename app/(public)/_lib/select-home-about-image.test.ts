import { describe, expect, it, vi } from 'vitest'
import type { Work, WorkImage } from '@/lib/api/works'
import type { HomeWorksSelection } from './select-home-works'

vi.mock('server-only', () => ({}))

const { selectHomeAboutImage } = await import('./select-home-about-image')

function makeImage(id: string, isCover: boolean, order = 0): WorkImage {
  return {
    id,
    url: `https://res.cloudinary.com/demo/${id}.jpg`,
    publicId: id,
    alt: `Alt ${id}`,
    isCover,
    order,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
  }
}

function makeWork(id: string, images: WorkImage[] = [makeImage(`${id}-cover`, true)]): Work {
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

function selectionFor(heroWork: Work | null, featured: Work[]): HomeWorksSelection {
  return {
    hero: heroWork
      ? { image: makeImage(`${heroWork.id}-hero`, true), work: heroWork }
      : null,
    featured: featured.map((work) => ({ work, image: makeImage(`${work.id}-f`, true) })),
  }
}

const emptySelection: HomeWorksSelection = { hero: null, featured: [] }

describe('selectHomeAboutImage', () => {
  it('exclui o work do Hero e os works de "Our Work"', () => {
    const works = ['1', '2', '3', '4', '5'].map((id) => makeWork(id))
    const result = selectHomeAboutImage(
      works,
      selectionFor(works[0] ?? null, works.slice(1, 4)),
    )

    expect(result?.work.id).toBe('5')
    expect(result?.image.id).toBe('5-cover')
  })

  it('hero com work nulo (imagem do Admin não associada): exclui apenas featured', () => {
    const works = ['1', '2', '3', '4'].map((id) => makeWork(id))
    const selection: HomeWorksSelection = {
      hero: { image: { url: 'https://res.cloudinary.com/demo/home.jpg', alt: '' }, work: null },
      featured: works.slice(0, 3).map((work) => ({ work, image: makeImage(`${work.id}-f`, true) })),
    }

    expect(selectHomeAboutImage(works, selection)?.work.id).toBe('4')
  })

  it('sem hero e sem featured: retorna o primeiro work com imagem', () => {
    const works = [makeWork('1', []), makeWork('2'), makeWork('3')]

    expect(selectHomeAboutImage(works, emptySelection)?.work.id).toBe('2')
  })

  it('usa imagem que não é capa via resolvePreviewImage (menor order)', () => {
    const works = [
      makeWork('1', [makeImage('1-b', false, 2), makeImage('1-a', false, 1)]),
    ]
    const result = selectHomeAboutImage(works, emptySelection)

    expect(result?.work.id).toBe('1')
    expect(result?.image.id).toBe('1-a')
  })

  it('respeita a ordem da API', () => {
    const works = [makeWork('9'), makeWork('3'), makeWork('7')]

    expect(selectHomeAboutImage(works, selectionFor(works[0] ?? null, []))?.work.id).toBe('3')
  })

  it('retorna null para lista vazia', () => {
    expect(selectHomeAboutImage([], emptySelection)).toBeNull()
  })

  it('retorna null quando todos os works já estão no Hero ou em "Our Work"', () => {
    const works = ['1', '2', '3'].map((id) => makeWork(id))

    expect(
      selectHomeAboutImage(works, selectionFor(works[0] ?? null, works.slice(1))),
    ).toBeNull()
  })

  it('retorna null quando os works restantes não têm imagens', () => {
    const works = [makeWork('1'), makeWork('2', []), makeWork('3', [])]

    expect(selectHomeAboutImage(works, selectionFor(works[0] ?? null, []))).toBeNull()
  })

  it('exclusão é por work: work em "Our Work" com várias imagens não é reaproveitado', () => {
    const multi = makeWork('1', [makeImage('1-cover', true), makeImage('1-extra', false, 1)])
    const works = [multi, makeWork('2')]
    const selection: HomeWorksSelection = {
      hero: null,
      featured: [{ work: multi, image: makeImage('1-cover', true) }],
    }

    const result = selectHomeAboutImage(works, selection)
    expect(result?.work.id).toBe('2')
    expect(result?.image.id).toBe('2-cover')
  })

  it('work do Hero também presente em "Our Work" é excluído sem afetar os demais', () => {
    const works = ['1', '2', '3'].map((id) => makeWork(id))

    expect(
      selectHomeAboutImage(works, selectionFor(works[0] ?? null, works.slice(0, 2)))?.work.id,
    ).toBe('3')
  })

  it('prefere a capa quando o work tem capa e outras imagens', () => {
    const works = [
      makeWork('1', [makeImage('1-a', false, 0), makeImage('1-cover', true, 5)]),
    ]

    expect(selectHomeAboutImage(works, emptySelection)?.image.id).toBe('1-cover')
  })

  it('não muta a lista de works recebida', () => {
    const works = ['1', '2'].map((id) => makeWork(id))
    const snapshot = structuredClone(works)

    selectHomeAboutImage(works, selectionFor(works[0] ?? null, []))
    expect(works).toEqual(snapshot)
  })
})
