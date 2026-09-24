import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

const toastErrorMock = vi.fn()

vi.mock('sonner', () => ({
  toast: {
    error: (message: string) => toastErrorMock(message),
  },
}))

import ProjectDetailsError from './error'
import { runErrorBoundaryTests } from '../error-boundary.test-helpers'

const FRIENDLY_MESSAGE =
  "We couldn't load this project right now. Please try again in a few moments."

runErrorBoundaryTests({
  describeLabel: 'ProjectDetailsError (app/(public)/portfolio/[slug]/error.tsx)',
  Component: ProjectDetailsError,
  sourceDir: __dirname,
  toastErrorMock,
  friendlyMessage: FRIENDLY_MESSAGE,
  headingText: "We couldn't load this project",
  retryButtonText: 'Try again',
  recoveryProp: 'retry',
})

describe('ProjectDetailsError — conteúdo do estado', () => {
  it('exibe um único h1, a mensagem inline, retry com 44px e link para /portfolio', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    render(<ProjectDetailsError error={new Error('falha')} retry={vi.fn()} />)

    expect(screen.getAllByRole('heading')).toHaveLength(1)
    expect(screen.getByText(FRIENDLY_MESSAGE)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Try again' })).toHaveClass('h-11')
    expect(screen.getByRole('link', { name: 'Back to portfolio' })).toHaveAttribute(
      'href',
      '/portfolio',
    )
    expect(document.body.textContent).not.toMatch(/Tentar novamente|Não foi possível/)
  })
})
