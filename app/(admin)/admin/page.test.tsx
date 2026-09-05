import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import AdminPage from './page'

describe('AdminPage (admin placeholder)', () => {
  it('renderiza o título e o texto de placeholder da área administrativa', () => {
    render(<AdminPage />)

    expect(
      screen.getByRole('heading', { level: 1, name: 'Admin' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Área administrativa — em construção.'),
    ).toBeInTheDocument()
  })
})
