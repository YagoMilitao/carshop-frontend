import { afterEach, describe, expect, it, vi, type Mock } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { ComponentType } from 'react'

type ErrorBoundaryProps = {
  error: Error & { digest?: string }
  reset: () => void
}

type RunErrorBoundaryTestsOptions = {
  describeLabel: string
  Component: ComponentType<ErrorBoundaryProps>
  sourceDir: string
  toastErrorMock: Mock
  friendlyMessage: string
  headingText: string
}

export function runErrorBoundaryTests({
  describeLabel,
  Component,
  sourceDir,
  toastErrorMock,
  friendlyMessage,
  headingText,
}: RunErrorBoundaryTestsOptions) {
  describe(describeLabel, () => {
    afterEach(() => {
      vi.clearAllMocks()
    })

    it("é declarado como Client Component ('use client' na primeira linha)", () => {
      const source = readFileSync(join(sourceDir, 'error.tsx'), 'utf-8')

      expect(source.trimStart().startsWith("'use client'")).toBe(true)
    })

    it('dispara toast.error com mensagem amigável e loga o erro original ao montar', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const error = Object.assign(new Error('falha de rede simulada'), {
        digest: 'digest-1',
      })

      render(<Component error={error} reset={vi.fn()} />)

      expect(toastErrorMock).toHaveBeenCalledWith(friendlyMessage)
      expect(consoleErrorSpy).toHaveBeenCalledWith(error)

      consoleErrorSpy.mockRestore()
    })

    it('renderiza a UI de fallback e chama reset() ao clicar em "Tentar novamente"', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {})
      const reset = vi.fn()
      const error = Object.assign(new Error('falha simulada'), {
        digest: 'digest-2',
      })

      render(<Component error={error} reset={reset} />)

      expect(
        screen.getByRole('heading', {
          level: 1,
          name: headingText,
        }),
      ).toBeInTheDocument()

      const button = screen.getByRole('button', { name: 'Tentar novamente' })
      await userEvent.click(button)

      expect(reset).toHaveBeenCalledTimes(1)
    })
  })
}
