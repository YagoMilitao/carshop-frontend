import { describe, expect, it, vi } from 'vitest'
import type { Work, WorkImage } from '@/lib/api/works'

vi.mock('server-only', () => ({}))

const { groupWorksByCategory, SERVICE_PROJECT_LINKS_LIMIT } = await import(
  './group-works-by-category'
)

function makeImage(id: string): WorkImage {
  return {
    id,
    url: `https://res.cloudinary.com/demo/${id}.jpg`,
    publicId: id,
    alt: `Interior ${id}`,
    isCover: true,
    order: 0,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
  }
}

function makeWork(id: string, category: string, hasImage = true): Work {
  return {
    id,
    slug: `work-${id}`,
    title: `Work ${id}`,
    description: 'Descrição',
    category,
    tags: [],
    images: hasImage ? [makeImage(`${id}-cover`)] : [],
    status: 'published',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
    deletedAt: null,
  }
}

describe('groupWorksByCategory', () => {
  it('expõe o limite de links por categoria', () => {
    expect(SERVICE_PROJECT_LINKS_LIMIT).toBe(4)
  })

  it('agrupa ignorando caixa e espaços extras, com o label da primeira ocorrência', () => {
    const result = groupWorksByCategory([
      makeWork('1', 'Bancos de Couro'),
      makeWork('2', '  bancos   de couro '),
      makeWork('3', 'BANCOS DE COURO'),
    ])

    expect(result).toHaveLength(1)
    expect(result[0].label).toBe('Bancos de Couro')
    expect(result[0].key).toBe('bancos de couro')
    expect(result[0].works.map((work) => work.id)).toEqual(['1', '2', '3'])
  })

  it('colapsa espaços internos e aplica trim no label', () => {
    const [group] = groupWorksByCategory([makeWork('1', '  Teto \t  solar ')])

    expect(group.label).toBe('Teto solar')
  })

  it('normaliza NFC e preserva acentos (sem remover diacríticos)', () => {
    const decomposed = 'Restauração'
    const composed = 'Restauração'

    const result = groupWorksByCategory([
      makeWork('1', decomposed),
      makeWork('2', composed),
      makeWork('3', 'Restauracao'),
    ])

    expect(result.map((group) => group.label)).toEqual(['Restauração', 'Restauracao'])
    expect(result[0].works.map((work) => work.id)).toEqual(['1', '2'])
  })

  it('não aplica stemming nem sinônimos', () => {
    const result = groupWorksByCategory([makeWork('1', 'banco'), makeWork('2', 'bancos')])

    expect(result).toHaveLength(2)
  })

  it('descarta categorias vazias ou só com espaços', () => {
    const result = groupWorksByCategory([
      makeWork('1', ''),
      makeWork('2', '   '),
      makeWork('3', 'Volantes'),
    ])

    expect(result.map((group) => group.label)).toEqual(['Volantes'])
  })

  it('ordena pela primeira aparição na ordem da API (sem ranking por contagem)', () => {
    const result = groupWorksByCategory([
      makeWork('1', 'Volantes'),
      makeWork('2', 'Bancos'),
      makeWork('3', 'Bancos'),
      makeWork('4', 'Tetos'),
    ])

    expect(result.map((group) => group.label)).toEqual(['Volantes', 'Bancos', 'Tetos'])
  })

  it('usa como preview o primeiro work do grupo que tem imagem', () => {
    const [group] = groupWorksByCategory([
      makeWork('1', 'Bancos', false),
      makeWork('2', 'Bancos'),
      makeWork('3', 'Bancos'),
    ])

    expect(group.preview?.work.id).toBe('2')
    expect(group.preview?.image.id).toBe('2-cover')
  })

  it('preview é null quando nenhum work do grupo tem imagem', () => {
    const [group] = groupWorksByCategory([
      makeWork('1', 'Bancos', false),
      makeWork('2', 'Bancos', false),
    ])

    expect(group.preview).toBeNull()
  })

  it('retorna lista vazia sem works e não muta a entrada', () => {
    expect(groupWorksByCategory([])).toEqual([])

    const works = Object.freeze([makeWork('1', 'Bancos')])
    const snapshot = JSON.stringify(works)
    groupWorksByCategory(works)
    expect(JSON.stringify(works)).toBe(snapshot)
  })
})
