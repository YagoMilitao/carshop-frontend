import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import type { Work } from '@/lib/api/works'
import { makeServiceWork as makeWork } from '@/test/fixtures/service-work'

const getWorksMock = vi.fn<() => Promise<Work[]>>()

vi.mock('server-only', () => ({}))

vi.mock('@/lib/api/works', () => ({
  getWorks: () => getWorksMock(),
  getCoverImage: (work: Work) => work.images.find((image) => image.isCover),
}))

async function renderServices() {
  const { default: ServicesPage } = await import('./page')
  return render(await ServicesPage())
}

function expectHeaderAndCtas() {
  const headings = screen.getAllByRole('heading', { level: 1 })
  expect(headings).toHaveLength(1)
  expect(headings[0]).toHaveTextContent('Services')
  expect(screen.getByText('Upholstery · Restoration · Custom Work')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'View Our Work' })).toHaveAttribute(
    'href',
    '/portfolio',
  )
  expect(screen.getByRole('button', { name: 'Get a Quote (coming soon)' })).toBeDisabled()
}

describe('ServicesPage (public)', () => {
  afterEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  it('renderiza h1, tagline e CTAs', async () => {
    getWorksMock.mockResolvedValue([])
    await renderServices()

    expectHeaderAndCtas()
  })

  it('renderiza uma linha por categoria deduplicada, com h2 exibindo o label como veio da API', async () => {
    getWorksMock.mockResolvedValue([
      makeWork('1', 'Bancos de couro'),
      makeWork('2', 'Volantes'),
      makeWork('3', '  BANCOS   de couro '),
    ])

    const { container } = await renderServices()

    const list = container.querySelector('ol')
    expect(list).not.toBeNull()
    expect(list?.querySelectorAll(':scope > li')).toHaveLength(2)

    const h2s = screen.getAllByRole('heading', { level: 2 })
    expect(h2s.map((heading) => heading.textContent)).toEqual(['Bancos de couro', 'Volantes'])
    expect(screen.getByText('2 projects')).toBeInTheDocument()
    expect(screen.getByText('1 project')).toBeInTheDocument()
  })

  it('exibe o label com acentos e caixa originais, sem atributo lang', async () => {
    getWorksMock.mockResolvedValue([
      makeWork('1', 'Restauração de Painéis'),
      makeWork('2', 'restauração de painéis'),
    ])
    const { container } = await renderServices()

    expect(
      screen.getByRole('heading', { level: 2, name: 'Restauração de Painéis' }),
    ).toBeInTheDocument()
    expect(screen.getByText('2 projects')).toBeInTheDocument()
    expect(container.querySelector('ol [lang]')).toBeNull()
  })

  it('descarta works com categoria vazia: sem lista quando nenhuma categoria é válida', async () => {
    getWorksMock.mockResolvedValue([makeWork('1', ''), makeWork('2', '   ')])
    const { container } = await renderServices()

    expectHeaderAndCtas()
    expect(container.querySelector('ol')).toBeNull()
    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('limita a 4 links de projeto e mostra "View all projects" quando há mais', async () => {
    getWorksMock.mockResolvedValue(
      ['1', '2', '3', '4', '5'].map((id) => makeWork(id, 'Bancos')),
    )
    await renderServices()

    const row = screen.getByRole('article', { name: 'Bancos' })
    const projectLinks = within(row)
      .getAllByRole('link')
      .filter((link) => link.getAttribute('href')?.startsWith('/portfolio/'))

    expect(projectLinks.map((link) => link.getAttribute('href'))).toEqual([
      '/portfolio/work-1',
      '/portfolio/work-2',
      '/portfolio/work-3',
      '/portfolio/work-4',
    ])
    expect(within(row).getByRole('link', { name: 'View all projects' })).toHaveAttribute(
      'href',
      '/portfolio',
    )
    expect(screen.getByText('5 projects')).toBeInTheDocument()
  })

  it('aplica preload somente na primeira imagem da página', async () => {
    getWorksMock.mockResolvedValue([
      makeWork('1', 'Tetos', false),
      makeWork('2', 'Bancos'),
      makeWork('3', 'Volantes'),
    ])
    await renderServices()

    const images = screen.getAllByRole('img')
    const eager = images.filter((image) => image.getAttribute('loading') !== 'lazy')
    expect(images).toHaveLength(2)
    expect(eager).toHaveLength(1)
    expect(eager[0]).toHaveAttribute('alt', 'Interior 2-cover')
  })

  it('renderiza linha tipográfica quando a categoria não tem foto', async () => {
    getWorksMock.mockResolvedValue([makeWork('1', 'Tetos', false)])
    await renderServices()

    const row = screen.getByRole('article', { name: 'Tetos' })
    expect(within(row).queryByRole('img')).not.toBeInTheDocument()
    expect(within(row).getByRole('link', { name: 'Work 1' })).toHaveAttribute(
      'href',
      '/portfolio/work-1',
    )
  })

  it('quando getWorks() falha: mantém header e CTAs, sem lista, e registra console.error', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    getWorksMock.mockRejectedValue(new Error('backend indisponível'))
    const { container } = await renderServices()

    expectHeaderAndCtas()
    expect(container.querySelector('ol')).toBeNull()
    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument()
    expect(consoleErrorSpy).toHaveBeenCalled()
  })

  it('não exibe descrições de serviço inventadas nem placeholders', async () => {
    getWorksMock.mockResolvedValue([makeWork('1', 'Bancos')])
    const { container } = await renderServices()
    const text = container.textContent ?? ''

    expect(text).not.toMatch(/construction|em construção|lorem|\$\d|price/i)
    expect(text).not.toMatch(/built to last|\bfree\b/i)
  })

  it('define metadata sem "under construction"', async () => {
    const { metadata } = await import('./page')
    const description =
      'Upholstery · Restoration · Custom Work — services shown through real CarShop projects.'

    expect(metadata.title).toBe('Services')
    expect(metadata.description).toBe(description)
    expect(metadata.alternates?.canonical).toBe('http://localhost:3000/services')
    expect(metadata.openGraph).toMatchObject({ title: 'Services', description })
    expect(JSON.stringify(metadata)).not.toMatch(/construction/i)
  })
})
