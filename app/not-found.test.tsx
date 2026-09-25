import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import NotFound, { metadata } from './not-found'

describe('NotFound (app/not-found.tsx)', () => {
  it('renderiza um único h1 em inglês dentro de <main>', () => {
    render(<NotFound />)

    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getAllByRole('heading')).toHaveLength(1)
    expect(
      screen.getByRole('heading', { level: 1, name: 'Page not found' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText("The page you're looking for doesn't exist or has been moved."),
    ).toBeInTheDocument()
  })

  it('oferece saída para a home com o anel de foco canônico', () => {
    render(<NotFound />)

    const link = screen.getByRole('link', { name: 'Back to home' })
    expect(link).toHaveAttribute('href', '/')
    expect(link).toHaveClass('focus-visible:ring-focus-ring')
  })

  it('define metadata.title', () => {
    expect(metadata.title).toBe('Page not found')
  })

  it('é um Server Component (sem "use client")', () => {
    const source = readFileSync(join(__dirname, 'not-found.tsx'), 'utf-8')

    expect(source).not.toMatch(/['"]use client['"]/)
  })
})
