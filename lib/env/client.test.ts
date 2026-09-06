import { afterEach, describe, expect, it, vi } from 'vitest'

/**
 * `lib/env/client.ts` faz o parse do schema Zod no top-level do módulo
 * (fail-fast). Para testar os cenários (válido, ausente, inválido)
 * isoladamente, cada teste manipula `process.env.NEXT_PUBLIC_API_URL` e
 * `process.env.NEXT_PUBLIC_SITE_URL` antes de um `import()` dinâmico com
 * `vi.resetModules()`, garantindo que o módulo seja reavaliado do zero a
 * cada caso.
 */
describe('lib/env/client', () => {
  const originalApiUrl = process.env.NEXT_PUBLIC_API_URL
  const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL

  afterEach(() => {
    if (originalApiUrl === undefined) {
      delete process.env.NEXT_PUBLIC_API_URL
    } else {
      process.env.NEXT_PUBLIC_API_URL = originalApiUrl
    }

    if (originalSiteUrl === undefined) {
      delete process.env.NEXT_PUBLIC_SITE_URL
    } else {
      process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl
    }

    vi.resetModules()
  })

  it('parseia clientEnv corretamente quando NEXT_PUBLIC_API_URL é uma URL válida', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3333'
    process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000'
    vi.resetModules()

    const { clientEnv } = await import('./client')

    expect(clientEnv).toEqual({
      NEXT_PUBLIC_API_URL: 'http://localhost:3333',
      NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
    })
  })

  it('lança erro de forma previsível quando NEXT_PUBLIC_API_URL está ausente', async () => {
    delete process.env.NEXT_PUBLIC_API_URL
    process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000'
    vi.resetModules()

    await expect(import('./client')).rejects.toThrow()
  })

  it('lança erro de forma previsível quando NEXT_PUBLIC_API_URL não é uma URL válida', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'nao-e-uma-url'
    process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000'
    vi.resetModules()

    await expect(import('./client')).rejects.toThrow()
  })

  it('parseia clientEnv corretamente quando NEXT_PUBLIC_SITE_URL é uma URL válida', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3333'
    process.env.NEXT_PUBLIC_SITE_URL = 'https://carshop.example.com'
    vi.resetModules()

    const { clientEnv } = await import('./client')

    expect(clientEnv).toEqual({
      NEXT_PUBLIC_API_URL: 'http://localhost:3333',
      NEXT_PUBLIC_SITE_URL: 'https://carshop.example.com',
    })
  })

  it('lança erro de forma previsível quando NEXT_PUBLIC_SITE_URL está ausente', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3333'
    delete process.env.NEXT_PUBLIC_SITE_URL
    vi.resetModules()

    await expect(import('./client')).rejects.toThrow()
  })

  it('lança erro de forma previsível quando NEXT_PUBLIC_SITE_URL não é uma URL válida', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3333'
    process.env.NEXT_PUBLIC_SITE_URL = 'nao-e-uma-url'
    vi.resetModules()

    await expect(import('./client')).rejects.toThrow()
  })
})
