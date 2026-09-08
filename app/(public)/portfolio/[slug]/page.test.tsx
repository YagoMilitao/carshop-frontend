import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { Work } from '@/lib/api/works'
import type { Comment } from '@/lib/api/comments'

const getWorkBySlugMock = vi.fn<(slug: string) => Promise<Work | undefined>>()
const notFoundMock = vi.fn(() => {
  throw new Error('NEXT_NOT_FOUND')
})

const getWorksMock = vi.fn<() => Promise<Work[]>>()
const getWorkCommentsMock = vi.fn<(workId: string) => Promise<Comment[]>>()

vi.mock('@/lib/api/works', () => ({
  getWorkBySlug: (slug: string) => getWorkBySlugMock(slug),
  getCoverImage: (work: Work) => work.images.find((image) => image.isCover),
  getWorks: () => getWorksMock(),
}))

vi.mock('@/lib/api/comments', () => ({
  getWorkComments: (workId: string) => getWorkCommentsMock(workId),
}))

vi.mock('next/navigation', () => ({
  notFound: () => notFoundMock(),
}))

const baseWork: Work = {
  id: '1',
  slug: 'restauracao-banco-fusca-1978',
  title: 'Restauração de banco — Fusca 1978',
  description: 'Restauração completa do banco original.',
  category: 'Estofamento',
  tags: ['fusca'],
  images: [
    {
      id: 'img-1',
      url: 'https://cdn.example.com/img-1.jpg',
      publicId: 'img-1',
      alt: 'Banco restaurado',
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

describe('ProjectDetailsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('generateStaticParams retorna { slug } para cada work real', async () => {
    getWorksMock.mockResolvedValue([
      baseWork,
      { ...baseWork, id: '2', slug: 'outro-projeto' },
    ])
    const { generateStaticParams } = await import('./page')

    const params = await generateStaticParams()

    expect(params).toEqual([
      { slug: baseWork.slug },
      { slug: 'outro-projeto' },
    ])
  })

  it('renderiza os dados reais do projeto encontrado pelo slug', async () => {
    getWorkBySlugMock.mockResolvedValue(baseWork)
    getWorkCommentsMock.mockResolvedValue([])
    const { default: ProjectDetailsPage } = await import('./page')

    render(
      await ProjectDetailsPage({
        params: Promise.resolve({ slug: baseWork.slug }),
      }),
    )

    expect(
      screen.getByRole('heading', { level: 1, name: baseWork.title }),
    ).toBeInTheDocument()
    expect(screen.getByText(baseWork.description)).toBeInTheDocument()
    expect(getWorkCommentsMock).toHaveBeenCalledWith(baseWork.id)
    expect(
      screen.getByText('Ainda não há comentários aprovados para este projeto.'),
    ).toBeInTheDocument()
  })

  it('renderiza os comentários aprovados retornados para o work', async () => {
    getWorkBySlugMock.mockResolvedValue(baseWork)
    getWorkCommentsMock.mockResolvedValue([
      {
        id: 'comment-1',
        workId: baseWork.id,
        authorName: 'Maria',
        content: 'Ficou excelente!',
        status: 'APPROVED',
        createdAt: '2024-01-03T00:00:00.000Z',
        updatedAt: '2024-01-03T00:00:00.000Z',
      },
    ])
    const { default: ProjectDetailsPage } = await import('./page')

    render(
      await ProjectDetailsPage({
        params: Promise.resolve({ slug: baseWork.slug }),
      }),
    )

    expect(screen.getByText('Maria')).toBeInTheDocument()
    expect(screen.getByText('Ficou excelente!')).toBeInTheDocument()
  })

  it('chama notFound() quando o slug não corresponde a nenhum work', async () => {
    getWorkBySlugMock.mockResolvedValue(undefined)
    const { default: ProjectDetailsPage } = await import('./page')

    await expect(
      ProjectDetailsPage({ params: Promise.resolve({ slug: 'inexistente' }) }),
    ).rejects.toThrow('NEXT_NOT_FOUND')
    expect(notFoundMock).toHaveBeenCalled()
  })

  it('generateMetadata popula openGraph.images a partir da imagem de capa', async () => {
    getWorkBySlugMock.mockResolvedValue(baseWork)
    const { generateMetadata } = await import('./page')

    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: baseWork.slug }),
    })

    expect(metadata.title).toBe(`${baseWork.title} — CarShop`)
    expect(metadata.openGraph).toMatchObject({
      type: 'article',
      images: [{ url: baseWork.images[0].url, alt: baseWork.images[0].alt }],
    })
    expect(metadata.alternates?.canonical).toBe(`/portfolio/${baseWork.slug}`)
  })

  it('generateMetadata não força imagem quando não há capa', async () => {
    const workWithoutCover: Work = { ...baseWork, images: [] }
    getWorkBySlugMock.mockResolvedValue(workWithoutCover)
    const { generateMetadata } = await import('./page')

    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: baseWork.slug }),
    })

    expect(metadata.openGraph).not.toHaveProperty('images')
  })

  it('generateMetadata chama notFound() quando o slug não existe', async () => {
    getWorkBySlugMock.mockResolvedValue(undefined)
    const { generateMetadata } = await import('./page')

    await expect(
      generateMetadata({ params: Promise.resolve({ slug: 'inexistente' }) }),
    ).rejects.toThrow('NEXT_NOT_FOUND')
    expect(notFoundMock).toHaveBeenCalled()
  })
})
