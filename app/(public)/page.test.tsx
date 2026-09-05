import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import HomePage from './page'

describe('HomePage (public placeholder)', () => {
  it('renderiza o título e o texto de placeholder da página inicial', () => {
    render(<HomePage />)

    expect(
      screen.getByRole('heading', { level: 1, name: 'CarShop' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Página inicial — em construção.'),
    ).toBeInTheDocument()
  })
})
