import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { Work } from '@/lib/api/works'
import type { Comment } from '@/lib/api/comments'

// `formatCommentDate` (page.tsx) usa `Intl.DateTimeFormat` sem `timeZone`
// explícito, ou seja, depende do fuso horário local do processo Node em
// execução (ver achado reportado ao reviewer/developer). Fixamos `TZ=UTC`
// aqui para que as asserções de data sejam determinísticas
// independentemente da máquina/CI que roda a suíte — isso NÃO corrige o
// bug de fuso horário, apenas isola o teste dele.
process.env.TZ = 'UTC'

const getWorkBySlugMock = vi.fn<(slug: string) => Promise<Work | undefined>>()
const notFoundMock = vi.fn(() => {
  throw new Error('NEXT_NOT_FOUND')
})

const getWorksMock = vi.fn<() => Promise<Work[]>>()
const getWorkCommentsMock = vi.fn<(workId: string) => Promise<Comment[]>>()
const toastErrorMock = vi.fn()

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

  it('renderiza a galeria de imagens (WorkGallery) do work no corpo da página', async () => {
    getWorkBySlugMock.mockResolvedValue(baseWork)
    getWorkCommentsMock.mockResolvedValue([])
    const { default: ProjectDetailsPage } = await import('./page')

    render(
      await ProjectDetailsPage({
        params: Promise.resolve({ slug: baseWork.slug }),
      }),
    )

    expect(
      screen.getByRole('button', { name: 'Ampliar imagem 1 de 1' }),
    ).toBeInTheDocument()
    expect(screen.getByAltText('Banco restaurado')).toBeInTheDocument()
  })

  it('não renderiza a galeria quando o work não possui imagens', async () => {
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
      screen.queryByRole('button', { name: /Ampliar imagem/ }),
    ).not.toBeInTheDocument()
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

  it('renderiza <ErrorToast /> e comentários vazios quando getWorkComments() falha', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    getWorkBySlugMock.mockResolvedValue(baseWork)
    getWorkCommentsMock.mockRejectedValue(new Error('backend indisponível'))
    const { default: ProjectDetailsPage } = await import('./page')

    render(
      await ProjectDetailsPage({
        params: Promise.resolve({ slug: baseWork.slug }),
      }),
    )

    expect(toastErrorMock).toHaveBeenCalledWith(
      'Não foi possível carregar os comentários agora. Tente novamente mais tarde.',
    )
    expect(
      screen.getByText('Ainda não há comentários aprovados para este projeto.'),
    ).toBeInTheDocument()
    expect(consoleErrorSpy).toHaveBeenCalled()

    consoleErrorSpy.mockRestore()
  })
})
