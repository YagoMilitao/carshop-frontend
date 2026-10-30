import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import {
  HOME_SERVICE_CATEGORIES_LIMIT,
  HomeServices,
  SERVICE_PILLARS,
} from './home-services'

type Category = { key: string; label: string }

function makeCategories(labels: readonly string[]): Category[] {
  return labels.map((label) => ({ key: label.toLowerCase(), label }))
}

function renderServices(categories: readonly Category[] = []) {
  return render(<HomeServices categories={categories} />)
}

function getSection(container: HTMLElement): HTMLElement {
  const section = container.querySelector<HTMLElement>('section#services')
  if (!section) throw new Error('section#services não encontrada')
  return section
}

describe('HomeServices', () => {
  it('expõe os pilares aprovados e o limite de categorias', () => {
    expect(SERVICE_PILLARS).toEqual(['Upholstery', 'Restoration', 'Custom Work'])
    expect(HOME_SERVICE_CATEGORIES_LIMIT).toBe(6)
  })

  it('renderiza a seção ancorada em #services com um único h2 "Services"', () => {
    const { container } = renderServices(makeCategories(['bancos']))
    const section = getSection(container)

    expect(section).toHaveAttribute('aria-labelledby', 'services-heading')
    const headings = within(section).getAllByRole('heading')
    expect(headings).toHaveLength(1)
    expect(headings[0]).toHaveAttribute('id', 'services-heading')
    expect(
      within(section).getByRole('heading', { level: 2, name: 'Services' }),
    ).toBeInTheDocument()
  })

  it('renderiza os três pilares em ordem dentro de um <ol>, sem serem headings', () => {
    const { container } = renderServices()
    const section = getSection(container)

    const list = section.querySelector('ol')
    expect(list).not.toBeNull()
    if (!list) return

    const items = within(list).getAllByRole('listitem')
    expect(items).toHaveLength(3)
    expect(items.map((item) => item.textContent)).toEqual([
      '01Upholstery',
      '02Restoration',
      '03Custom Work',
    ])
    for (const pillar of SERVICE_PILLARS) {
      expect(within(section).queryByRole('heading', { name: pillar })).not.toBeInTheDocument()
    }
    for (const item of items) {
      expect(item.querySelector('[aria-hidden="true"]')).toHaveTextContent(/^0\d$/)
    }
  })

  it('exibe as categorias com os labels exatos da API, na ordem recebida', () => {
    renderServices(makeCategories(['bancos', 'Teto solar', 'volantes']))

    const list = screen.getByRole('list', { name: 'Project categories' })
    expect(list).toHaveAttribute('aria-labelledby', 'services-categories-label')
    const items = within(list).getAllByRole('listitem')
    expect(items.map((item) => item.textContent?.replace('·', ''))).toEqual([
      'bancos',
      'Teto solar',
      'volantes',
    ])
    expect(within(list).queryByRole('link')).not.toBeInTheDocument()
    expect(list.querySelector('[lang]')).toBeNull()
  })

  it('separa as categorias com "·" decorativo (aria-hidden)', () => {
    renderServices(makeCategories(['bancos', 'volantes']))

    const list = screen.getByRole('list', { name: 'Project categories' })
    const separators = list.querySelectorAll('[aria-hidden="true"]')
    expect(separators).toHaveLength(1)
    expect(separators[0]).toHaveTextContent('·')
  })

  it(`limita a evidência a ${HOME_SERVICE_CATEGORIES_LIMIT} categorias`, () => {
    renderServices(makeCategories(['a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8']))

    const list = screen.getByRole('list', { name: 'Project categories' })
    const items = within(list).getAllByRole('listitem')
    expect(items).toHaveLength(HOME_SERVICE_CATEGORIES_LIMIT)
    expect(list).not.toHaveTextContent('a7')
  })

  it(`exibe todas as categorias quando há exatamente ${HOME_SERVICE_CATEGORIES_LIMIT}`, () => {
    const labels = ['a1', 'a2', 'a3', 'a4', 'a5', 'a6']
    renderServices(makeCategories(labels))

    const list = screen.getByRole('list', { name: 'Project categories' })
    expect(
      within(list)
        .getAllByRole('listitem')
        .map((item) => item.textContent?.replace('·', '')),
    ).toEqual(labels)
  })

  it('sem categorias: seção e CTA renderizam, sem label nem lista de evidência', () => {
    const { container } = renderServices([])
    const section = getSection(container)

    expect(within(section).getByRole('heading', { level: 2, name: 'Services' })).toBeInTheDocument()
    expect(within(section).queryByText('Project categories')).not.toBeInTheDocument()
    expect(section.querySelector('ul')).toBeNull()
    expect(within(section).getByRole('link', { name: 'Contact DreamUP' })).toHaveAttribute(
      'href',
      '/#contact',
    )
  })

  it('CTA "Contact DreamUP" aponta para /#contact e não há "Get a Quote"', () => {
    const { container } = renderServices(makeCategories(['bancos']))
    const section = getSection(container)

    const links = within(section).getAllByRole('link')
    expect(links).toHaveLength(1)
    expect(links[0]).toHaveAccessibleName('Contact DreamUP')
    expect(links[0]).toHaveAttribute('href', '/#contact')
    expect(within(section).queryByText(/get a quote/i)).not.toBeInTheDocument()
    expect(within(section).queryByRole('button')).not.toBeInTheDocument()
  })

  it('mantém a ordem do DOM: heading → pilares → evidência → CTA', () => {
    const { container } = renderServices(makeCategories(['bancos']))
    const section = getSection(container)

    const heading = within(section).getByRole('heading', { level: 2 })
    const pillars = section.querySelector('ol')
    const evidence = within(section).getByRole('list', { name: 'Project categories' })
    const cta = within(section).getByRole('link', { name: 'Contact DreamUP' })

    const ordered = [heading, pillars, evidence, cta]
    for (let index = 1; index < ordered.length; index += 1) {
      const previous = ordered[index - 1]
      const current = ordered[index]
      expect(previous).not.toBeNull()
      expect(current).not.toBeNull()
      if (!previous || !current) return
      expect(
        previous.compareDocumentPosition(current) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy()
    }
  })

  it('não renderiza imagens', () => {
    renderServices(makeCategories(['bancos', 'volantes']))

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(document.querySelector('img')).toBeNull()
  })

  it('não exibe copy proibida, inventada ou strings de estado em pt-BR', () => {
    const { container } = renderServices(makeCategories(['bancos']))
    const text = container.textContent ?? ''

    expect(text).not.toMatch(/Custom Interiors/i)
    expect(text).not.toMatch(/Repairs/i)
    expect(text).not.toMatch(/built to last/i)
    expect(text).not.toMatch(/\bfree\b/i)
    expect(text).not.toMatch(/\d+\+/)
    expect(text).not.toMatch(/Crafted for your car/i)
    expect(text).not.toMatch(/Não foi possível|Nenhum projeto|em construção|Carregando/)
  })
})
