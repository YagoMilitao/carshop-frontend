import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Configuração standalone do Vitest para o projeto Next.js.
// Não depende de vite.config.ts (removido na migração Vite → Next.js,
// ver specs/CARSHOP-113/plan.md) — usamos apenas o plugin do Vitest
// necessário para JSX/TSX + React 19 em ambiente de testes.
// O alias `@/*` espelha o `paths` do tsconfig.json (necessário pelo
// Shadcn/UI e demais imports absolutos), já que o Vitest não lê
// automaticamente os `paths` do TypeScript.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('.', import.meta.url)),
      'next/font/google': fileURLToPath(
        new URL('./test/mocks/next-font-google.ts', import.meta.url),
      ),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.test.{ts,tsx}'],
    exclude: ['node_modules', '.next'],
    // Defaults de env para o schema Zod fail-fast de `lib/env/client.ts`
    // (ex.: Server Components como `app/layout.tsx` importam `clientEnv`
    // no top-level). Testes que exercitam o próprio schema (`client.test.ts`,
    // `server.test.ts`, `http.test.ts`) sobrescrevem/removem essas
    // variáveis pontualmente por teste, restaurando este default no
    // `afterEach`.
    env: {
      NEXT_PUBLIC_API_URL: 'http://localhost:3333',
      NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['app/**/*.{ts,tsx}', 'lib/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}'],
      exclude: [
        'app/**/*.test.{ts,tsx}',
        'lib/**/*.test.{ts,tsx}',
        'components/**/*.test.{ts,tsx}',
        '**/*.d.ts',
      ],
    },
  },
})
