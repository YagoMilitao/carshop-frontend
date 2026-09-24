import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import ProjectNotFound from './not-found'

describe('ProjectNotFound (app/(public)/portfolio/[slug]/not-found.tsx)', () => {
  it('exibe um único h1, a mensagem em inglês e o link de volta para /portfolio', () => {
    render(<ProjectNotFound />)

    expect(screen.getAllByRole('heading')).toHaveLength(1)
    expect(
      screen.getByRole('heading', { level: 1, name: 'Project not found' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText("This project doesn't exist or is no longer published."),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to portfolio' })).toHaveAttribute(
      'href',
      '/portfolio',
    )
  })

  it('é um Server Component (sem "use client")', async () => {
    const { readFileSync } = await import('node:fs')
    const { join } = await import('node:path')
    const source = readFileSync(join(__dirname, 'not-found.tsx'), 'utf-8')

    expect(source).not.toMatch(/['"]use client['"]/)
  })

  it('não há loading.tsx no segmento nem em /portfolio (evita soft-404 acima de notFound())', async () => {
    const { existsSync } = await import('node:fs')
    const { join } = await import('node:path')

    for (const dir of [__dirname, join(__dirname, '..')]) {
      for (const file of ['loading.tsx', 'loading.ts', 'loading.jsx', 'loading.js']) {
        expect(existsSync(join(dir, file))).toBe(false)
      }
    }
  })
})
