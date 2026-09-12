import { vi } from 'vitest'

const toastErrorMock = vi.fn()

vi.mock('sonner', () => ({
  toast: {
    error: (message: string) => toastErrorMock(message),
  },
}))

import ProjectDetailsError from './error'
import { runErrorBoundaryTests } from '../error-boundary.test-helpers'

runErrorBoundaryTests({
  describeLabel: 'ProjectDetailsError (app/(public)/portfolio/[slug]/error.tsx)',
  Component: ProjectDetailsError,
  sourceDir: __dirname,
  toastErrorMock,
  friendlyMessage: 'Não foi possível carregar este projeto agora. Tente novamente em alguns instantes.',
  headingText: 'Não foi possível carregar este projeto',
})
