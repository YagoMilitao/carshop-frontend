import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

const toastErrorMock = vi.fn()

vi.mock('sonner', () => ({
  toast: {
    error: (message: string) => toastErrorMock(message),
  },
}))

import PortfolioError from './error'
import { runErrorBoundaryTests } from './error-boundary.test-helpers'

runErrorBoundaryTests({
  describeLabel: 'PortfolioError (app/(public)/portfolio/error.tsx)',
  Component: PortfolioError,
  sourceDir: __dirname,
  toastErrorMock,
  friendlyMessage:
    "We couldn't load the portfolio right now. Please try again in a few moments.",
  headingText: 'Portfolio',
  retryButtonText: 'Try again',
})

describe('PortfolioError — conteúdo do estado', () => {
  it('explica a falha e oferece retry (≥ 44px) e link para a Home', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    render(<PortfolioError error={new Error('falha')} reset={vi.fn()} />)

    expect(
      screen.getByRole('heading', { level: 2, name: "We couldn't load the portfolio" }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Try again' })).toHaveClass('h-11')
    expect(screen.getByRole('link', { name: 'Back to home' })).toHaveAttribute('href', '/')
    expect(screen.queryByText(/Tentar novamente|Não foi possível/)).not.toBeInTheDocument()
    expect(document.body.textContent).not.toMatch(/Tentar novamente|Não foi possível|Ocorreu um erro/)
    expect(toastErrorMock).not.toHaveBeenCalledWith(expect.stringMatching(/Não foi possível/))
    expect(
      screen.getByText('Upholstery, restoration and custom interior projects by CarShop.'),
    ).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  })
})
