import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import RootLayout, { metadata } from './layout'

// RootLayout renderiza <html>/<body>, que não podem ser aninhados dentro do
// container padrão do Testing Library (que já injeta em document.body).
// Por isso validamos a marcação via renderToStaticMarkup, suficiente para
// um smoke test de Server Component.
describe('RootLayout', () => {
  it('renderiza html com lang="pt-BR" e os children dentro do body', () => {
    const html = renderToStaticMarkup(
      <RootLayout>
        <p>conteúdo da página</p>
      </RootLayout>,
    )

    expect(html).toContain('lang="pt-BR"')
    expect(html).toContain('<body>')
    expect(html).toContain('conteúdo da página')
  })

  it('define metadata base (title e description)', () => {
    expect(metadata.title).toBe('CarShop')
    expect(metadata.description).toBe('CarShop — tapeçaria automotiva')
  })
})
