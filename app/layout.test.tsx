import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import RootLayout, { metadata } from './layout'

// RootLayout renderiza <html>/<body>, que não podem ser aninhados dentro do
// container padrão do Testing Library (que já injeta em document.body).
// Por isso validamos a marcação via renderToStaticMarkup, suficiente para
// um smoke test de Server Component.
describe('RootLayout', () => {
  it('renderiza html com lang="en-US" e os children dentro do body', () => {
    const html = renderToStaticMarkup(
      <RootLayout>
        <p>conteúdo da página</p>
      </RootLayout>,
    )

    expect(html).toContain('lang="en-US"')
    expect(html).toContain('<body>')
    expect(html).toContain('conteúdo da página')
  })

  it('define metadata base (title, description e metadataBase)', () => {
    expect(metadata.title).toEqual({
      default: 'CarShop',
      template: '%s | CarShop',
    })
    expect(metadata.description).toBe(
      'CarShop — automotive upholstery services.',
    )
    expect(metadata.metadataBase).toBeInstanceOf(URL)
  })

  it('define Open Graph base (siteName, locale e type)', () => {
    expect(metadata.openGraph).toMatchObject({
      siteName: 'CarShop',
      locale: 'en_US',
      type: 'website',
    })
  })
})
