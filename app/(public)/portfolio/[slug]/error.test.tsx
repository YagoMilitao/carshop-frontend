import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const toastErrorMock = vi.fn()

vi.mock('sonner', () => ({
  toast: {
    error: (message: string) => toastErrorMock(message),
  },
}))

import ProjectDetailsError from './error'

describe('ProjectDetailsError (app/(public)/portfolio/[slug]/error.tsx)', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it("é declarado como Client Component ('use client' na primeira linha)", () => {
    const source = readFileSync(join(__dirname, 'error.tsx'), 'utf-8')

    expect(source.trimStart().startsWith("'use client'")).toBe(true)
  })

  it('dispara toast.error com mensagem amigável e loga o erro original ao montar', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const error = Object.assign(new Error('falha de rede simulada'), {
      digest: 'digest-1',
    })

    render(<ProjectDetailsError error={error} reset={vi.fn()} />)

    expect(toastErrorMock).toHaveBeenCalledWith(
      'Não foi possível carregar este projeto agora. Tente novamente em alguns instantes.',
    )
    expect(consoleErrorSpy).toHaveBeenCalledWith(error)

    consoleErrorSpy.mockRestore()
  })

  it('renderiza a UI de fallback e chama reset() ao clicar em "Tentar novamente"', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const reset = vi.fn()
    const error = Object.assign(new Error('falha simulada'), {
      digest: 'digest-2',
    })

    render(<ProjectDetailsError error={error} reset={reset} />)

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Não foi possível carregar este projeto',
      }),
    ).toBeInTheDocument()

    const button = screen.getByRole('button', { name: 'Tentar novamente' })
    await userEvent.click(button)

    expect(reset).toHaveBeenCalledTimes(1)
  })
})
