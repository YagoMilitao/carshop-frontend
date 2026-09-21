import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import PublicLayout from './layout'

/**
 * `PublicLayout` renderiza `Footer` (Server Component), que importa
 * `serverEnv` (lib/env/server.ts) e, transitivamente, o pacote
 * `server-only`. Sob Vitest esse pacote sempre lança (ver limitação
 * documentada em `lib/env/server.test.ts`), então precisamos do mesmo
 * mock no-op usado em `components/layout/footer.test.tsx`.
 */
vi.mock('server-only', () => ({}))

describe('PublicLayout', () => {
  it('renderiza os children recebidos', () => {
    render(
      <PublicLayout>
        <p>conteúdo filho</p>
      </PublicLayout>,
    )

    expect(screen.getByText('conteúdo filho')).toBeInTheDocument()
  })

  it('envolve os children com Header e Footer do layout compartilhado', () => {
    render(
      <PublicLayout>
        <p>conteúdo filho</p>
      </PublicLayout>,
    )

    const header = screen.getByRole('banner')
    const main = screen.getByRole('main')
    const footer = screen.getByRole('contentinfo')

    expect(header).toBeInTheDocument()
    expect(footer).toBeInTheDocument()
    expect(main).toContainElement(screen.getByText('conteúdo filho'))

    // Garante a ordem visual Header -> main -> Footer no DOM.
    const position = header.compareDocumentPosition(main)
    expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    const footerPosition = main.compareDocumentPosition(footer)
    expect(footerPosition & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
})
