import { describe, expect, it } from 'vitest'
import robots from './robots'

describe('app/robots', () => {
  it('permite crawling geral e bloqueia /admin', () => {
    const result = robots()

    expect(result.rules).toEqual({
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/admin/'],
    })
  })

  it('aponta o sitemap para a URL absoluta baseada em NEXT_PUBLIC_SITE_URL', () => {
    const result = robots()

    expect(result.sitemap).toBe('http://localhost:3000/sitemap.xml')
  })
})
