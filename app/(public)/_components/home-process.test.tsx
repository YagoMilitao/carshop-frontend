import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { HOME_PROCESS_CONTENT, HomeProcess, type HomeProcessContent } from './home-process'

// Fixture neutra: não há copy aprovada do processo (CARSHOP-168).
const fixture: HomeProcessContent = {
  heading: 'Test heading',
  steps: [{ title: 'Step A', description: 'Test description' }, { title: 'Step B' }],
}

function getSection(container: HTMLElement): HTMLElement {
  const section = container.querySelector<HTMLElement>('section#process')
  if (!section) throw new Error('section#process não encontrada')
  return section
}

describe('HomeProcess', () => {
  it('sem conteúdo aprovado: HOME_PROCESS_CONTENT é null', () => {
    expect(HOME_PROCESS_CONTENT).toBeNull()
  })

  it('produção (sem props) → não renderiza nada (sem âncora #process)', () => {
    const { container } = render(<HomeProcess />)

    expect(container).toBeEmptyDOMElement()
  })

  it('content null explícito → não renderiza nada', () => {
    const { container } = render(<HomeProcess content={null} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('com conteúdo: section#process associada ao heading via aria-labelledby', () => {
    const { container } = render(<HomeProcess content={fixture} />)
    const section = getSection(container)

    expect(section).toHaveAttribute('aria-labelledby', 'home-process-heading')
    expect(screen.getByRole('region', { name: 'Test heading' })).toBe(section)
    expect(within(section).getByRole('heading', { level: 2 })).toHaveAttribute(
      'id',
      'home-process-heading',
    )
  })

  it('tem exatamente um h2 e nenhum h1/h3', () => {
    render(<HomeProcess content={fixture} />)

    expect(screen.getAllByRole('heading')).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Test heading')
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 3 })).not.toBeInTheDocument()
  })

  it('renderiza uma <ol> com um item por etapa, na ordem recebida', () => {
    const { container } = render(<HomeProcess content={fixture} />)
    const section = getSection(container)

    const list = section.querySelector('ol')
    expect(list).not.toBeNull()
    const items = within(section).getAllByRole('listitem')
    expect(items).toHaveLength(fixture.steps.length)
    expect(items[0]).toHaveTextContent('Step A')
    expect(items[1]).toHaveTextContent('Step B')
  })

  it('numera as etapas (01, 02) com aria-hidden', () => {
    const { container } = render(<HomeProcess content={fixture} />)
    const items = within(getSection(container)).getAllByRole('listitem')

    items.forEach((item, index) => {
      const number = item.querySelector('span')
      expect(number).toHaveAttribute('aria-hidden', 'true')
      expect(number).toHaveTextContent(String(index + 1).padStart(2, '0'))
    })
  })

  it('exibe a descrição apenas na etapa que a possui', () => {
    const { container } = render(<HomeProcess content={fixture} />)
    const [first, second] = within(getSection(container)).getAllByRole('listitem')

    expect(within(first).getByText('Test description')).toBeInTheDocument()
    expect(first.querySelectorAll('p')).toHaveLength(2)
    expect(within(second).queryByText('Test description')).not.toBeInTheDocument()
    expect(second.querySelectorAll('p')).toHaveLength(1)
  })

  it('não contém links nem padrões de estatística', () => {
    const { container } = render(<HomeProcess content={fixture} />)
    const section = getSection(container)

    expect(within(section).queryByRole('link')).not.toBeInTheDocument()
    expect(section.textContent ?? '').not.toMatch(/\d+\+|%|years of experience/i)
  })
})
