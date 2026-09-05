import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import PublicLayout from './layout'

describe('PublicLayout', () => {
  it('renderiza os children recebidos sem wrapper adicional visível', () => {
    render(
      <PublicLayout>
        <p>conteúdo filho</p>
      </PublicLayout>,
    )

    expect(screen.getByText('conteúdo filho')).toBeInTheDocument()
  })
})
