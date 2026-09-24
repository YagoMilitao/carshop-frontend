import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

const { getSocialLinks } = await import('./social-links')

describe('getSocialLinks', () => {
  it('declara a proteção server-only como primeira instrução', () => {
    const source = readFileSync(join(__dirname, 'social-links.ts'), 'utf8')
    expect(source.trimStart().startsWith('import "server-only"')).toBe(true)
  })

  it('retorna os links configurados em ordem fixa com labels fixos', () => {
    expect(
      getSocialLinks({
        linkedinUrl: 'https://linkedin.com/company/example',
        facebookUrl: 'https://facebook.com/example',
        instagramUrl: 'https://instagram.com/example',
      }),
    ).toEqual([
      { href: 'https://instagram.com/example', label: 'Instagram' },
      { href: 'https://facebook.com/example', label: 'Facebook' },
      { href: 'https://linkedin.com/company/example', label: 'LinkedIn' },
    ])
  })

  it('omite redes não configuradas', () => {
    expect(
      getSocialLinks({
        instagramUrl: undefined,
        facebookUrl: 'https://facebook.com/example',
        linkedinUrl: undefined,
      }),
    ).toEqual([{ href: 'https://facebook.com/example', label: 'Facebook' }])
  })

  it('retorna lista vazia quando nenhuma rede está configurada', () => {
    expect(
      getSocialLinks({
        instagramUrl: undefined,
        facebookUrl: undefined,
        linkedinUrl: undefined,
      }),
    ).toEqual([])
  })

  it('usa serverEnv.social por padrão', () => {
    expect(Array.isArray(getSocialLinks())).toBe(true)
  })
})
