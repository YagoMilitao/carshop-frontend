import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import ErrorBoundary from './error'

describe('ErrorBoundary (app/error.tsx)', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('é declarado como Client Component (\'use client\' na primeira linha)', () => {
    const source = readFileSync(join(__dirname, 'error.tsx'), 'utf-8')

    expect(source.trimStart().startsWith("'use client'")).toBe(true)
  })

  it('renderiza a mensagem de erro em inglês e permite acionar o reset', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const reset = vi.fn()
    const error = Object.assign(new Error('falha simulada'), {
      digest: 'abc123',
    })

    render(<ErrorBoundary error={error} reset={reset} />)

    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getAllByRole('heading')).toHaveLength(1)
    expect(
      screen.getByRole('heading', { level: 1, name: 'Something went wrong' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('An unexpected error occurred. Please try again in a few moments.'),
    ).toBeInTheDocument()

    const button = screen.getByRole('button', { name: 'Try again' })
    await userEvent.click(button)

    expect(reset).toHaveBeenCalledTimes(1)
  })

  it('oferece link de volta para a home', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    render(<ErrorBoundary error={new Error('x')} reset={vi.fn()} />)

    const link = screen.getByRole('link', { name: 'Back to home' })
    expect(link).toHaveAttribute('href', '/')
    expect(link).toHaveClass('outline-hidden', 'focus-visible:ring-focus-ring')
  })

  it('usa o primitive Button (foco canônico) em vez de <button> cru', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    render(<ErrorBoundary error={new Error('x')} reset={vi.fn()} />)

    const button = screen.getByRole('button', { name: 'Try again' })
    expect(button).toHaveAttribute('data-slot', 'button')
    expect(button).toHaveClass('focus-visible:ring-focus-ring')
  })

  it('registra novamente quando o erro muda', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const first = new Error('primeiro')
    const second = new Error('segundo')

    const { rerender } = render(<ErrorBoundary error={first} reset={vi.fn()} />)
    rerender(<ErrorBoundary error={second} reset={vi.fn()} />)

    expect(consoleError).toHaveBeenCalledWith(first)
    expect(consoleError).toHaveBeenCalledWith(second)
  })

  it('registra o erro no console', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const error = new Error('falha simulada')

    render(<ErrorBoundary error={error} reset={vi.fn()} />)

    expect(consoleError).toHaveBeenCalledWith(error)
  })
})
