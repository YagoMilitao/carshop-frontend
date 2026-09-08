import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import AdminLayout, { metadata } from './layout'

describe('AdminLayout', () => {
  it('renderiza os children recebidos sem wrapper adicional visível', () => {
    render(
      <AdminLayout>
        <p>conteúdo filho admin</p>
      </AdminLayout>,
    )

    expect(screen.getByText('conteúdo filho admin')).toBeInTheDocument()
  })

  it('nunca é indexável (robots noindex, nofollow), inclusive /admin/login', () => {
    expect(metadata.robots).toEqual({ index: false, follow: false })
  })
})
