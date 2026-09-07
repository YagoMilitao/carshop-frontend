# Regra: Rendering (Server vs Client Components)

- Server Components são o padrão quando não há necessidade de
  interatividade ou de APIs de browser.
- Client Components (`"use client"`) devem ser introduzidos na menor
  boundary necessária — nunca marcar uma árvore inteira como client por
  conveniência.
- `developer` nunca adiciona `use client` indiscriminadamente; `architect`
  decide e justifica tecnicamente a escolha Server vs Client quando a task
  envolve estrutura nova.
- Conteúdo público prioriza Server Components/renderização do Next quando
  apropriado; estado de servidor interativo no cliente usa TanStack Query
  (ver [docs/rules/state-query.md](./state-query.md)) apenas quando há
  necessidade real de interatividade client-side.
- Cache e estratégia de revalidação (quando o App Router estiver em uso) são
  responsabilidade do `architect`/`developer` e revisadas pelo `reviewer`.

## Estratégia por página (CARSHOP-114 / CARSHOP-116)

Decisão do `architect`, atualizada na `CARSHOP-116` para refletir o estado
real pós-integração com a API de `Work`s:

| Página | Rendering hoje | Server/Client | Cache/revalidation |
|---|---|---|---|
| Home (`app/(public)/page.tsx`) | Estático (SSG implícito, sem `fetch`) | Server Component | Sem revalidação — conteúdo puramente estático até existir dado dinâmico |
| About (`app/(public)/about/page.tsx`) | Estático | Server Component | Idem |
| Services (`app/(public)/services/page.tsx`) | Estático | Server Component | Idem |
| Portfolio — listagem (`app/(public)/portfolio/page.tsx`) | ISR — busca real via `getWorks()` (`lib/api/works.ts`, `GET /works`) | Server Component | `revalidate: WORKS_REVALIDATE_SECONDS` (3600s/1h) + `tags: ['works']` no `fetch` nativo do Next |
| Project Details (`app/(public)/portfolio/[slug]/page.tsx`) | ISR — `generateStaticParams()` via `getWorks()`; corpo/`generateMetadata` via `getWorkBySlug(slug)`, com `notFound()` quando o slug não existe | Server Component (`generateMetadata` assíncrono) | Mesma fonte/cache de `getWorks()` (`revalidate` 3600s, `tags: ['works']`); detalhe por slug é mitigado buscando `GET /works` (lista completa) e filtrando no servidor, já que o backend não expõe `GET /works/:slug` público — decisão confirmada, sem endpoint dedicado |
| Contact (`app/(public)/contact/page.tsx`) | Estático (wrapper) | Server Component; o formulário futuro deve ser um Client Component isolado na menor boundary (não a página inteira) | N/A até existir formulário |
| Admin (`app/(admin)/admin/**`) | Dinâmico, nunca tratado como conteúdo público cacheável | Decisão de Server/Client por feature, fora do escopo desta task | **Nunca cacheado como página pública**: `robots: { index: false, follow: false }` na própria rota (defesa em profundidade) + `disallow: ['/admin', '/admin/']` em `app/robots.ts`; nenhuma resposta autenticada/sensível deve reutilizar cache de rota pública |

Critério geral: a escolha estático/dinâmico/ISR é por característica do
dado exibido (conteúdo público sem mudança frequente → estático; conteúdo
público dependente de API com atualização periódica → ISR; conteúdo
autenticado/sensível → sempre dinâmico e nunca cacheado como público), não
uma regra única aplicada a todo o app.

## SEO técnico (CARSHOP-114)

- `app/layout.tsx` define a fundação de metadata (`title` com `template`,
  `description`, `metadataBase` a partir de `NEXT_PUBLIC_SITE_URL`,
  `openGraph` base) herdada por todas as rotas; páginas filhas sobrescrevem
  apenas os campos necessários (`title`, `description`, `openGraph.title`,
  `openGraph.description`).
- `alternates.canonical` é definido nas páginas públicas estáticas
  (About/Services/Portfolio/Contact) e, em Project Details, derivado do
  `slug` recebido em `generateMetadata` — nunca um valor fixo de exemplo.
- `app/robots.ts` e `app/sitemap.ts` (Next.js Metadata Files API) são a
  fonte de verdade de crawling; `/admin` é sempre excluído de ambos.
  `app/sitemap.ts` inclui, além das rotas estáticas, uma entrada por `Work`
  publicado real (`/portfolio/[slug]`, `lastModified` a partir de
  `work.updatedAt`), obtidas via `getWorks()` (`lib/api/works.ts`).
