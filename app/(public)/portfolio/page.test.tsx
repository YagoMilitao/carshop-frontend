import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { Work } from '@/lib/api/works'

const getWorksMock = vi.fn<() => Promise<Work[]>>()

vi.mock('@/lib/api/works', () => ({
  getWorks: () => getWorksMock(),
  getCoverImage: (work: Work) => work.images.find((image) => image.isCover),
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

const workWithCover: Work = {
  id: '2',
  slug: 'pintura-personalizada-opala',
  title: 'Pintura personalizada — Opala',
  description: 'Pintura customizada completa.',
  category: 'Pintura',
  tags: ['opala'],
  images: [
    {
      id: 'img-1',
      url: 'https://res.cloudinary.com/demo/opala-capa.jpg',
      publicId: 'opala-capa',
      alt: 'Opala pintado',
      isCover: true,
      order: 0,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-02T00:00:00.000Z',
    },
  ],
  status: 'published',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-02T00:00:00.000Z',
  deletedAt: null,
}

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

  it('não renderiza miniatura quando o work não possui imagem de capa', async () => {
    getWorksMock.mockResolvedValue(works)
    const { default: PortfolioPage } = await import('./page')

    render(await PortfolioPage())

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('renderiza a miniatura (WorkImageThumb) da imagem de capa quando existir', async () => {
    getWorksMock.mockResolvedValue([workWithCover])
    const { default: PortfolioPage } = await import('./page')

    render(await PortfolioPage())

    const thumb = screen.getByAltText('Opala pintado')
    expect(thumb).toBeInTheDocument()
    expect(thumb).toHaveAttribute(
      'src',
      expect.stringContaining('opala-capa.jpg'),
    )
    expect(
      screen.getByRole('link', { name: 'Pintura personalizada — Opala' }),
    ).toHaveAttribute('href', '/portfolio/pintura-personalizada-opala')
  })

  it('define metadata (title, canonical e Open Graph)', async () => {
    const { metadata } = await import('./page')

    expect(metadata.title).toBe('Portfolio')
    expect(metadata.alternates?.canonical).toContain('/portfolio')
    expect(metadata.openGraph).toMatchObject({ title: 'Portfolio' })
  })
})
