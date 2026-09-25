import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'

// Guarda de regressão de CARSHOP-149 (A-01, A-02, A-05): o token de foco
// canônico é `focus-ring` em opacidade total e overlays não usam
// glassmorphism (docs/design/visual-direction.md "Anti-SaaS Rule").
// Varre o código-fonte de `app/` e `components/` (exceto testes).
const ROOT = join(__dirname, '..')
const SCANNED_DIRS = ['app', 'components']
const SOURCE_FILE = /\.(tsx?|css)$/
const TEST_FILE = /\.test(-helpers)?\.tsx?$/

const FORBIDDEN_PATTERNS: ReadonlyArray<{ label: string; pattern: RegExp }> = [
  { label: 'ring-ring/50 (contraste 2.01:1)', pattern: /\bring-ring\/50\b/ },
  { label: 'outline-ring/50 (contraste 2.01:1)', pattern: /\boutline-ring\/50\b/ },
  { label: 'backdrop-blur (glassmorphism)', pattern: /\bbackdrop-blur/ },
]

function collectSourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) return collectSourceFiles(fullPath)
    if (SOURCE_FILE.test(entry.name) && !TEST_FILE.test(entry.name)) return [fullPath]
    return []
  })
}

const sourceFiles = SCANNED_DIRS.flatMap((dir) => collectSourceFiles(join(ROOT, dir)))

describe('guarda do design system (CARSHOP-149)', () => {
  it('encontra arquivos-fonte para varrer', () => {
    expect(sourceFiles.length).toBeGreaterThan(0)
    expect(sourceFiles.map((file) => relative(ROOT, file))).toContain('app/globals.css')
  })

  it.each(FORBIDDEN_PATTERNS)('nenhum arquivo em app/ ou components/ usa $label', ({ pattern }) => {
    const offenders = sourceFiles
      .filter((file) => pattern.test(readFileSync(file, 'utf-8')))
      .map((file) => relative(ROOT, file))

    expect(offenders).toEqual([])
  })

  it('o outline base usa o token de foco canônico', () => {
    const css = readFileSync(join(ROOT, 'app', 'globals.css'), 'utf-8')

    expect(css).toMatch(/@apply border-border outline-focus-ring;/)
  })
})
