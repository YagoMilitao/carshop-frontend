import { afterEach, describe, expect, it, vi } from 'vitest'

/**
 * `lib/env/client.ts` faz o parse do schema Zod no top-level do módulo
 * (fail-fast). Para testar os três cenários (válido, ausente, inválido)
 * isoladamente, cada teste manipula `process.env.NEXT_PUBLIC_API_URL`
 * antes de um `import()` dinâmico com `vi.resetModules()`, garantindo que
 * o módulo seja reavaliado do zero a cada caso.
 */
describe('lib/env/client', () => {
  const originalValue = process.env.NEXT_PUBLIC_API_URL

  afterEach(() => {
    if (originalValue === undefined) {
      delete process.env.NEXT_PUBLIC_API_URL
    } else {
      process.env.NEXT_PUBLIC_API_URL = originalValue
    }
    vi.resetModules()
  })

  it('parseia clientEnv corretamente quando NEXT_PUBLIC_API_URL é uma URL válida', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3333'
    vi.resetModules()

    const { clientEnv } = await import('./client')

    expect(clientEnv).toEqual({ NEXT_PUBLIC_API_URL: 'http://localhost:3333' })
  })

  it('lança erro de forma previsível quando NEXT_PUBLIC_API_URL está ausente', async () => {
    delete process.env.NEXT_PUBLIC_API_URL
    vi.resetModules()

    await expect(import('./client')).rejects.toThrow()
  })

  it('lança erro de forma previsível quando NEXT_PUBLIC_API_URL não é uma URL válida', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'nao-e-uma-url'
    vi.resetModules()

    await expect(import('./client')).rejects.toThrow()
  })
})
