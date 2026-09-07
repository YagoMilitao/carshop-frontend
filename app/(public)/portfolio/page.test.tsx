import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { Work } from '@/lib/api/works'

const getWorksMock = vi.fn<() => Promise<Work[]>>()

vi.mock('@/lib/api/works', () => ({
  getWorks: () => getWorksMock(),
}))

const works: Work[] = [
  {
    id: '1',
    slug: 'restauracao-banco-fusca-1978',
    title: 'Restauração de banco — Fusca 1978',
    description: 'Restauração completa do banco original.',
    category: 'Estofamento',
    tags: ['fusca'],
    images: [],
    status: 'published',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
    deletedAt: null,
  },
]

describe('PortfolioPage', () => {
  it('renderiza a listagem de projetos reais a partir de getWorks()', async () => {
    getWorksMock.mockResolvedValue(works)
    const { default: PortfolioPage } = await import('./page')

    render(await PortfolioPage())

    expect(
      screen.getByRole('heading', { level: 1, name: 'Portfolio' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Restauração de banco — Fusca 1978' }),
    ).toHaveAttribute('href', '/portfolio/restauracao-banco-fusca-1978')
  })

  it('define metadata (title, canonical e Open Graph)', async () => {
    const { metadata } = await import('./page')

    expect(metadata.title).toBe('Portfolio')
    expect(metadata.alternates?.canonical).toContain('/portfolio')
    expect(metadata.openGraph).toMatchObject({ title: 'Portfolio' })
  })
})
