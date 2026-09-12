import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Work } from '@/lib/api/works'

const getWorksMock = vi.fn<() => Promise<Work[]>>()

vi.mock('@/lib/api/works', () => ({
  getWorks: () => getWorksMock(),
}))

const publishedWork: Work = {
  id: '1',
  slug: 'restauracao-banco-fusca-1978',
  title: 'Restauração de banco — Fusca 1978',
  description: 'Restauração completa do banco original.',
  category: 'Estofamento',
  tags: ['fusca'],
  images: [],
  status: 'published',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-03-05T00:00:00.000Z',
  deletedAt: null,
}

const draftWork: Work = {
  ...publishedWork,
  id: '2',
  slug: 'projeto-em-rascunho',
  status: 'draft',
}

describe('app/sitemap', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('inclui as rotas públicas estáticas com URL absoluta e changeFrequency', async () => {
    getWorksMock.mockResolvedValue([])
    const { default: sitemap } = await import('./sitemap')

    const result = await sitemap()
    const urls = result.map((entry) => entry.url)

    expect(urls).toEqual([
      'http://localhost:3000/',
      'http://localhost:3000/about',
      'http://localhost:3000/services',
      'http://localhost:3000/portfolio',
      'http://localhost:3000/contact',
    ])
    result.forEach((entry) => {
      expect(entry.lastModified).toBeInstanceOf(Date)
    })
  })

  it('não inclui /admin', async () => {
    getWorksMock.mockResolvedValue([])
    const { default: sitemap } = await import('./sitemap')

    const urls = (await sitemap()).map((entry) => entry.url)

    expect(urls.some((url) => url.includes('/admin'))).toBe(false)
  })

  it('inclui uma entrada dinâmica por Work publicado, com url e lastModified reais', async () => {
    getWorksMock.mockResolvedValue([publishedWork, draftWork])
    const { default: sitemap } = await import('./sitemap')

    const result = await sitemap()
    const dynamicEntries = result.filter((entry) =>
      entry.url.includes(`/portfolio/${publishedWork.slug}`),
    )

    expect(dynamicEntries).toHaveLength(1)
    expect(dynamicEntries[0]?.url).toBe(
      `http://localhost:3000/portfolio/${publishedWork.slug}`,
    )
    expect(dynamicEntries[0]?.lastModified).toEqual(
      new Date(publishedWork.updatedAt),
    )
    expect(
      result.some((entry) => entry.url.includes(draftWork.slug)),
    ).toBe(false)
  })

  it('preserva as 5 rotas estáticas mesmo com works dinâmicos presentes', async () => {
    getWorksMock.mockResolvedValue([publishedWork])
    const { default: sitemap } = await import('./sitemap')

    const result = await sitemap()
    const staticCount = result.filter(
      (entry) => !entry.url.includes('/portfolio/restauracao'),
    ).length

    expect(staticCount).toBe(5)
    expect(result).toHaveLength(6)
  })

  it('retorna apenas as rotas estáticas quando getWorks falha (fallback gracioso)', async () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)
    getWorksMock.mockRejectedValue(new Error('Backend indisponível'))
    const { default: sitemap } = await import('./sitemap')

    const result = await sitemap()
    const urls = result.map((entry) => entry.url)

    expect(urls).toEqual([
      'http://localhost:3000/',
      'http://localhost:3000/about',
      'http://localhost:3000/services',
      'http://localhost:3000/portfolio',
      'http://localhost:3000/contact',
    ])
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1)

    consoleErrorSpy.mockRestore()
  })
})
