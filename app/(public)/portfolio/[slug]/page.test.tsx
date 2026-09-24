import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { Work } from '@/lib/api/works'
import type { Comment } from '@/lib/api/comments'

// `formatCommentDate` (project-comments.tsx) já fixa `timeZone: 'UTC'`;
// `TZ=UTC` mantém o restante da suíte determinístico entre máquinas/CI.
process.env.TZ = 'UTC'

const getWorkBySlugMock = vi.fn<(slug: string) => Promise<Work | undefined>>()
const notFoundMock = vi.fn(() => {
  throw new Error('NEXT_NOT_FOUND')
})

const getWorksMock = vi.fn<() => Promise<Work[]>>()
const getWorkCommentsMock = vi.fn<(workId: string) => Promise<Comment[]>>()
const toastErrorMock = vi.fn()

vi.mock('server-only', () => ({}))

vi.mock('@/lib/api/works', () => ({
  getWorkBySlug: (slug: string) => getWorkBySlugMock(slug),
  getCoverImage: (work: Work) => work.images.find((image) => image.isCover),
  getWorks: () => getWorksMock(),
}))

vi.mock('@/lib/api/comments', () => ({
  getWorkComments: (workId: string) => getWorkCommentsMock(workId),
}))

vi.mock('sonner', () => ({
  toast: {
    error: (message: string) => toastErrorMock(message),
  },
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

  it('renderiza os dados reais do projeto com um único h1, sem tags nem datas do work', async () => {
    getWorkBySlugMock.mockResolvedValue(baseWork)
    getWorkCommentsMock.mockResolvedValue([])
    const { default: ProjectDetailsPage } = await import('./page')

    render(
      await ProjectDetailsPage({
        params: Promise.resolve({ slug: baseWork.slug }),
      }),
    )

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    const h1 = screen.getByRole('heading', { level: 1, name: baseWork.title })
    expect(h1).toHaveAttribute('id', 'project-title')
    expect(screen.getByRole('article')).toHaveAttribute(
      'aria-labelledby',
      'project-title',
    )
    expect(screen.getByText(baseWork.category)).toBeInTheDocument()
    expect(screen.getByText(baseWork.description)).toBeInTheDocument()
    expect(screen.queryByText('fusca')).not.toBeInTheDocument()
    expect(screen.queryByText(/2024/)).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to portfolio' })).toHaveAttribute(
      'href',
      '/portfolio',
    )
    expect(getWorkCommentsMock).toHaveBeenCalledWith(baseWork.id)
    expect(screen.getByText('No comments yet.')).toBeInTheDocument()
  })

  it('segue a hierarquia h1 → h2 "Project photos" → h2 "Comments" → h3 "Leave a comment"', async () => {
    getWorkBySlugMock.mockResolvedValue(baseWork)
    getWorkCommentsMock.mockResolvedValue([])
    const { default: ProjectDetailsPage } = await import('./page')

    render(
      await ProjectDetailsPage({
        params: Promise.resolve({ slug: baseWork.slug }),
      }),
    )

    const headings = screen
      .getAllByRole('heading')
      .map((heading) => `${heading.tagName}:${heading.textContent}`)
    expect(headings).toEqual([
      `H1:${baseWork.title}`,
      'H2:Project photos',
      'H2:Comments',
      'H3:Leave a comment',
    ])
    expect(screen.getByRole('heading', { name: 'Project photos' })).toHaveClass(
      'sr-only',
    )
  })

  it('renderiza o hero da galeria com preload (não lazy) e botão acessível', async () => {
    getWorkBySlugMock.mockResolvedValue(baseWork)
    getWorkCommentsMock.mockResolvedValue([])
    const { default: ProjectDetailsPage } = await import('./page')

    render(
      await ProjectDetailsPage({
        params: Promise.resolve({ slug: baseWork.slug }),
      }),
    )

    expect(
      screen.getByRole('button', { name: 'View image 1 of 1: Banco restaurado' }),
    ).toBeInTheDocument()
    expect(screen.getByAltText('Banco restaurado')).not.toHaveAttribute(
      'loading',
      'lazy',
    )
  })

  it('com várias imagens: capa como hero único (preload), demais por order e lazy, sem before/after', async () => {
    const makeImage = (id: string, order: number, isCover: boolean) => ({
      ...baseWork.images[0],
      id,
      url: `https://cdn.example.com/${id}.jpg`,
      publicId: id,
      alt: `Foto ${id}`,
      isCover,
      order,
    })
    const workWithImages: Work = {
      ...baseWork,
      slug: 'projeto-varias-imagens',
      images: [
        makeImage('c', 3, false),
        makeImage('capa', 2, true),
        makeImage('a', 1, false),
        makeImage('b', 4, false),
      ],
    }
    getWorkBySlugMock.mockResolvedValue(workWithImages)
    getWorkCommentsMock.mockResolvedValue([])
    const { default: ProjectDetailsPage } = await import('./page')

    render(
      await ProjectDetailsPage({
        params: Promise.resolve({ slug: workWithImages.slug }),
      }),
    )

    const labels = screen
      .getAllByRole('button', { name: /^View image/ })
      .map((button) => button.getAttribute('aria-label'))
    expect(labels).toEqual([
      'View image 1 of 4: Foto capa',
      'View image 2 of 4: Foto a',
      'View image 3 of 4: Foto c',
      'View image 4 of 4: Foto b',
    ])
    expect(screen.getAllByAltText('Foto capa')).toHaveLength(1)
    expect(screen.getByAltText('Foto capa')).not.toHaveAttribute('loading', 'lazy')
    for (const alt of ['Foto a', 'Foto c', 'Foto b']) {
      expect(screen.getByAltText(alt)).toHaveAttribute('loading', 'lazy')
    }
    expect(document.querySelector('.aspect-square')).toBeNull()
    expect(document.body.textContent).not.toMatch(/before\s*(&|and|\/)\s*after|antes\s*(e|\/)\s*depois/i)
  })

  it('não renderiza a seção de fotos quando o work não possui imagens', async () => {
    const workWithoutImages: Work = { ...baseWork, images: [] }
    getWorkBySlugMock.mockResolvedValue(workWithoutImages)
    getWorkCommentsMock.mockResolvedValue([])
    const { default: ProjectDetailsPage } = await import('./page')

    render(
      await ProjectDetailsPage({
        params: Promise.resolve({ slug: baseWork.slug }),
      }),
    )

    expect(
      screen.queryByRole('button', { name: /View image/ }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Project photos' }),
    ).not.toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('propaga erros de getWorkBySlug (para o error.tsx) sem chamar notFound', async () => {
    getWorkBySlugMock.mockRejectedValue(new Error('backend indisponível'))
    const { default: ProjectDetailsPage } = await import('./page')

    await expect(
      ProjectDetailsPage({ params: Promise.resolve({ slug: baseWork.slug }) }),
    ).rejects.toThrow('backend indisponível')
    expect(notFoundMock).not.toHaveBeenCalled()
    expect(getWorkCommentsMock).not.toHaveBeenCalled()
  })

  it('renderiza os comentários aprovados retornados para o work, incluindo nome, mensagem e data formatada', async () => {
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

    const timeElement = screen.getByText('January 3, 2024')
    expect(timeElement).toBeInTheDocument()
    expect(timeElement.tagName).toBe('TIME')
    expect(timeElement).toHaveAttribute(
      'dateTime',
      '2024-01-03T00:00:00.000Z',
    )
  })

  it('renderiza a data de cada comentário aprovado formatada corretamente quando há múltiplos comentários', async () => {
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
      {
        id: 'comment-2',
        workId: baseWork.id,
        authorName: 'João',
        content: 'Recomendo muito.',
        status: 'APPROVED',
        createdAt: '2024-03-15T00:00:00.000Z',
        updatedAt: '2024-03-15T00:00:00.000Z',
      },
    ])
    const { default: ProjectDetailsPage } = await import('./page')

    render(
      await ProjectDetailsPage({
        params: Promise.resolve({ slug: baseWork.slug }),
      }),
    )

    expect(screen.getByText('January 3, 2024')).toBeInTheDocument()
    expect(screen.getByText('March 15, 2024')).toBeInTheDocument()
  })

  it('nunca renderiza o conteúdo de um comentário como HTML (proteção contra XSS)', async () => {
    getWorkBySlugMock.mockResolvedValue(baseWork)
    const maliciousContent = '<script>alert(1)</script><b>bold</b>'
    getWorkCommentsMock.mockResolvedValue([
      {
        id: 'comment-xss',
        workId: baseWork.id,
        authorName: 'Atacante',
        content: maliciousContent,
        status: 'APPROVED',
        createdAt: '2024-01-03T00:00:00.000Z',
        updatedAt: '2024-01-03T00:00:00.000Z',
      },
    ])
    const { default: ProjectDetailsPage } = await import('./page')

    const { container } = render(
      await ProjectDetailsPage({
        params: Promise.resolve({ slug: baseWork.slug }),
      }),
    )

    expect(screen.getByText(maliciousContent)).toBeInTheDocument()
    expect(container.querySelector('script')).not.toBeInTheDocument()
    expect(container.querySelector('b')).not.toBeInTheDocument()
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

  it('generateMetadata usa o título do work como alt da capa quando alt vem vazio', async () => {
    const workWithEmptyAlt: Work = {
      ...baseWork,
      images: [{ ...baseWork.images[0], alt: '' }],
    }
    getWorkBySlugMock.mockResolvedValue(workWithEmptyAlt)
    const { generateMetadata } = await import('./page')

    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: baseWork.slug }),
    })

    expect(metadata.openGraph).toMatchObject({
      images: [{ url: baseWork.images[0].url, alt: baseWork.title }],
    })
  })

  it('generateMetadata chama notFound() quando o slug não existe', async () => {
    getWorkBySlugMock.mockResolvedValue(undefined)
    const { generateMetadata } = await import('./page')

    await expect(
      generateMetadata({ params: Promise.resolve({ slug: 'inexistente' }) }),
    ).rejects.toThrow('NEXT_NOT_FOUND')
    expect(notFoundMock).toHaveBeenCalled()
  })

  it('generateStaticParams retorna [] (fallback gracioso) quando getWorks() falha mesmo após retries', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    getWorksMock.mockRejectedValue(new Error('backend indisponível'))
    const { generateStaticParams } = await import('./page')

    const params = await generateStaticParams()

    expect(params).toEqual([])
    expect(consoleErrorSpy).toHaveBeenCalled()

    consoleErrorSpy.mockRestore()
  })

  it('quando getWorkComments() falha, exibe toast + mensagem inline (sem mensagem de vazio) e mantém o formulário', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    getWorkBySlugMock.mockResolvedValue(baseWork)
    getWorkCommentsMock.mockRejectedValue(new Error('backend indisponível'))
    const { default: ProjectDetailsPage } = await import('./page')

    render(
      await ProjectDetailsPage({
        params: Promise.resolve({ slug: baseWork.slug }),
      }),
    )

    const message =
      "We couldn't load comments right now. Please try again later."
    expect(toastErrorMock).toHaveBeenCalledWith(message)
    expect(screen.getByText(message)).toBeInTheDocument()
    expect(screen.queryByText('No comments yet.')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send comment' })).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 1, name: baseWork.title }),
    ).toBeInTheDocument()
    expect(consoleErrorSpy).toHaveBeenCalled()

    consoleErrorSpy.mockRestore()
  })
})
