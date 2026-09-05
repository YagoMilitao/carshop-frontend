import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import ErrorBoundary from './error'

describe('ErrorBoundary (app/error.tsx)', () => {
  it('é declarado como Client Component (\'use client\' na primeira linha)', () => {
    const source = readFileSync(join(__dirname, 'error.tsx'), 'utf-8')

    expect(source.trimStart().startsWith("'use client'")).toBe(true)
  })

  it('renderiza a mensagem de erro e permite acionar o reset', async () => {
    const reset = vi.fn()
    const error = Object.assign(new Error('falha simulada'), {
      digest: 'abc123',
    })

    render(<ErrorBoundary error={error} reset={reset} />)

    expect(
      screen.getByRole('heading', { level: 1, name: 'Algo deu errado.' }),
    ).toBeInTheDocument()

    const button = screen.getByRole('button', { name: 'Tentar novamente' })
    await userEvent.click(button)

    expect(reset).toHaveBeenCalledTimes(1)
  })
})
