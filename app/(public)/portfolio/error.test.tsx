import { vi } from 'vitest'

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
  friendlyMessage: 'Não foi possível carregar o portfólio agora. Tente novamente em alguns instantes.',
  headingText: 'Não foi possível carregar o portfólio',
})
