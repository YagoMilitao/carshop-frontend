import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

/**
 * Limitação de teste unitário documentada: o pacote `server-only` usa
 * "export conditions" (`"react-server"` vs. `"default"`) — quem resolve a
 * condição correta é o bundler do Next.js (só define `react-server` ao
 * empacotar Server Components; um Client Component real cairia no branch
 * `"default"`, que lança erro). O Vitest/Node não define essa condição,
 * então QUALQUER import de `server.ts` sob Vitest cai sempre no branch
 * `"default"` (`node_modules/server-only/index.js`) e lança
 * incondicionalmente — não há como diferenciar client/server em runtime de
 * teste puro. Por isso:
 * - O requisito "declara a proteção `server-only`" é coberto de forma
 *   confiável verificando a presença de `import "server-only"` como
 *   primeira instrução do arquivo-fonte (abaixo).
 * - Para testar a lógica de `serverEnv` (mapeamento de `apiUrl`) isolada
 *   desse guard incondicional do ambiente de teste, mockamos o módulo
 *   `server-only` como no-op nos testes que precisam importar `server.ts`
 *   de fato — comportamento equivalente ao branch `"react-server"` real
 *   usado pelo Next.js em build de servidor.
 */
vi.mock('server-only', () => ({}))

describe('lib/env/server', () => {
  const originalValue = process.env.NEXT_PUBLIC_API_URL

  afterEach(() => {
    if (originalValue === undefined) {
      delete process.env.NEXT_PUBLIC_API_URL
    } else {
      process.env.NEXT_PUBLIC_API_URL = originalValue
    }
    vi.resetModules()
  })

  it('declara import "server-only" como primeira instrução do módulo', () => {
    const source = readFileSync(join(__dirname, 'server.ts'), 'utf-8')

    expect(source.trimStart().startsWith('import "server-only"')).toBe(true)
  })

  it('serverEnv.apiUrl reflete o valor de NEXT_PUBLIC_API_URL', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3333'
    vi.resetModules()

    const { serverEnv } = await import('./server')

    expect(serverEnv.apiUrl).toBe('http://localhost:3333')
  })

  it('serverEnv expõe apenas o campo apiUrl (nenhuma var server-only hoje)', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3333'
    vi.resetModules()

    const { serverEnv } = await import('./server')

    expect(Object.keys(serverEnv)).toEqual(['apiUrl'])
  })
})
