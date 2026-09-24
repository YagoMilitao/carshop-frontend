import { afterEach, describe, expect, it, vi, type Mock } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { ComponentType } from 'react'

type ErrorBoundaryProps = {
  error: Error & { digest?: string }
  reset: () => void
  retry: () => void
}

type RecoveryProp = 'reset' | 'retry'

type RunErrorBoundaryTestsOptions = {
  describeLabel: string
  Component: ComponentType<ErrorBoundaryProps>
  sourceDir: string
  toastErrorMock: Mock
  friendlyMessage: string
  headingText: string
  retryButtonText: string
  /** Prop de recuperação que o botão deve chamar (default `'reset'`). */
  recoveryProp?: RecoveryProp
}

export function runErrorBoundaryTests({
  describeLabel,
  Component,
  sourceDir,
  toastErrorMock,
  friendlyMessage,
  headingText,
  retryButtonText,
  recoveryProp = 'reset',
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

      render(<Component error={error} reset={vi.fn()} retry={vi.fn()} />)

      expect(toastErrorMock).toHaveBeenCalledWith(friendlyMessage)
      expect(consoleErrorSpy).toHaveBeenCalledWith(error)

      consoleErrorSpy.mockRestore()
    })

    it(`renderiza a UI de fallback e chama ${recoveryProp}() ao clicar em "${retryButtonText}"`, async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {})
      const reset = vi.fn()
      const retry = vi.fn()
      const error = Object.assign(new Error('falha simulada'), {
        digest: 'digest-2',
      })

      render(<Component error={error} reset={reset} retry={retry} />)

      expect(
        screen.getByRole('heading', {
          level: 1,
          name: headingText,
        }),
      ).toBeInTheDocument()

      const button = screen.getByRole('button', { name: retryButtonText })
      await userEvent.click(button)

      const [chosen, other] =
        recoveryProp === 'retry' ? [retry, reset] : [reset, retry]
      expect(chosen).toHaveBeenCalledTimes(1)
      expect(other).not.toHaveBeenCalled()
    })
  })
}
