import { describe, expect, it } from 'vitest'
import sitemap from './sitemap'

describe('app/sitemap', () => {
  it('inclui as rotas públicas estáticas com URL absoluta e changeFrequency', () => {
    const result = sitemap()
    const urls = result.map((entry) => entry.url)

    expect(urls).toEqual([
      'http://localhost:3000/',
      'http://localhost:3000/about',
      'http://localhost:3000/services',
      'http://localhost:3000/portfolio',
      'http://localhost:3000/contact',
    ])
    result.forEach((entry) => {
      expect(entry.lastModified).toBeInstanceOf(Date)
      expect(entry.changeFrequency).toBeTruthy()
    })
  })

  it('não inclui /admin nem entradas de portfolio/[slug]', () => {
    const urls = sitemap().map((entry) => entry.url)

    expect(urls.some((url) => url.includes('/admin'))).toBe(false)
    expect(urls).toHaveLength(5)
  })
})
