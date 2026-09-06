import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Configuração standalone do Vitest para o projeto Next.js.
// Não depende de vite.config.ts (removido na migração Vite → Next.js,
// ver specs/CARSHOP-113/plan.md) — usamos apenas o plugin do Vitest
// necessário para JSX/TSX + React 19 em ambiente de testes.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.test.{ts,tsx}'],
    exclude: ['node_modules', '.next'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['app/**/*.{ts,tsx}', 'lib/**/*.{ts,tsx}'],
      exclude: ['app/**/*.test.{ts,tsx}', 'lib/**/*.test.{ts,tsx}', '**/*.d.ts'],
    },
  },
})
