import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'

export default defineConfig([
  globalIgnores(['dist', '.next', 'coverage']),
  ...nextCoreWebVitals,
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
  {
    // `cn` must come from the configured merger in lib/utils.ts, which
    // registers the custom typography utilities from app/globals.css.
    files: ['**/*.{ts,tsx}'],
    ignores: ['lib/utils.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'cn',
              message: 'Import { cn } from "@/lib/utils" instead.',
            },
          ],
          patterns: [
            {
              group: ['cn/*'],
              message: 'Import { cn } from "@/lib/utils" instead.',
            },
          ],
        },
      ],
    },
  },
])
