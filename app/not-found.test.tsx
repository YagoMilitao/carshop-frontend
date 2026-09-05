import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import NotFound from './not-found'

describe('NotFound (rota 404)', () => {
  it('renderiza a mensagem de página não encontrada', () => {
    render(<NotFound />)

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: '404 — Página não encontrada',
      }),
    ).toBeInTheDocument()
  })
})
