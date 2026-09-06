import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import ProjectDetailsPage, { generateMetadata } from './page'

describe('ProjectDetailsPage (public placeholder)', () => {
  it('renderiza o título e o placeholder do projeto a partir do slug', async () => {
    render(await ProjectDetailsPage({ params: Promise.resolve({ slug: 'exemplo-fictício' }) }))

    expect(
      screen.getByRole('heading', { level: 1, name: 'Project — CarShop' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Página em construção para o projeto "exemplo-fictício".'),
    ).toBeInTheDocument()
  })

  it('gera metadata placeholder com openGraph.type "article" e canonical derivado do slug', async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: 'exemplo-fictício' }),
    })

    expect(metadata.title).toBe('Project — CarShop')
    expect(metadata.openGraph).toMatchObject({ type: 'article' })
    expect(metadata.alternates?.canonical).toBe('/portfolio/exemplo-fictício')
  })
})
