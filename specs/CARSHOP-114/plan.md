# Plan — CARSHOP-114: Renderização e SEO técnico no Next.js

> Classificação: NON-TRIVIAL. Plano persistido por `plan-writer` a partir da
> spec (`specs/CARSHOP-114/spec.md`) e das decisões do `architect`. Este
> plano não introduz decisões arquiteturais novas — reflete o que já foi
> decidido pelo usuário e pelo `architect`.

## Pré-requisito a confirmar antes de iniciar (bloqueio documentado)

- Nenhum bloqueio de dependência ausente foi sinalizado pelo `architect`
  para esta task. O único ponto que precisa de decisão operacional do
  usuário (não arquitetural) é o **valor real** de `NEXT_PUBLIC_SITE_URL`
  em cada ambiente (local/preview/produção) — o `developer` só documenta a
  variável em `.env.example` (sem valor real) e assume um valor de
  desenvolvimento local convencional (ex. `http://localhost:3000`) apenas
  no `.env` local não versionado. Se o domínio de produção definitivo ainda
  não existir, isso deve ser sinalizado ao usuário antes do deploy — não
  bloqueia a implementação desta task.

## Ordem de implementação

### 1. Fundação de env var (`NEXT_PUBLIC_SITE_URL`)

- Editar `lib/env/client.ts`: adicionar `NEXT_PUBLIC_SITE_URL: z.string().url()`
  ao `clientEnvSchema`, seguindo o padrão já existente (`NEXT_PUBLIC_API_URL`)
  — mesmo bloco de parse top-level, mesmo comentário de convenção.
- Editar `.env.example`: documentar `NEXT_PUBLIC_SITE_URL` (sem valor real),
  com comentário curto explicando o uso (base para `metadataBase`,
  `robots.ts`, `sitemap.ts`, Open Graph). Não commitar nenhum domínio real
  de produção.
- Atualizar/estender `lib/env/client.test.ts` para cobrir a nova variável
  (caso de sucesso com URL válida e caso de falha com valor ausente/mal
  formado), seguindo o padrão de teste já usado para `NEXT_PUBLIC_API_URL`.

### 2. Root layout (`app/layout.tsx`)

- Alterar `<html lang="pt-BR">` para `<html lang="en-US">` (decisão do
  usuário, já fechada).
- Atualizar `export const metadata` para:
  - `title: { default: 'CarShop', template: '%s | CarShop' }` (evita
    duplicação de sufixo nas páginas filhas).
  - `description` base em inglês, sem inventar copy de marketing final —
    frase técnica/neutra equivalente à atual, apenas traduzida/adaptada.
  - `metadataBase: new URL(clientEnv.NEXT_PUBLIC_SITE_URL)`.
  - `openGraph: { siteName: 'CarShop', locale: 'en_US', type: 'website' }`.
- Ajustar `app/layout.test.tsx` conforme necessário para refletir
  `lang="en-US"` e o novo formato de metadata (sem inventar asserts além do
  que o DoD pede).

### 3. Stubs de rota pública (Server Components, sem fetch)

Criar, nesta ordem, cada um com `export const metadata: Metadata` estático,
conteúdo placeholder mínimo (sem copy de negócio, seguindo o padrão já
existente em `app/(public)/page.tsx` — heading + parágrafo "em construção")
e teste `.test.tsx` espelhando o padrão de `app/(public)/page.test.tsx`:

1. `app/(public)/about/page.tsx` + `about/page.test.tsx`
2. `app/(public)/services/page.tsx` + `services/page.test.tsx`
3. `app/(public)/portfolio/page.tsx` + `portfolio/page.test.tsx`
   (listagem — Server Component estático nesta task; comentário/TODO no
   arquivo indicando candidato a ISR quando a API de projetos existir)
4. `app/(public)/contact/page.tsx` + `contact/page.test.tsx`
   (wrapper Server; comentário indicando que o formulário futuro deve ser
   um Client Component isolado, não a página inteira — nenhum formulário é
   implementado nesta task)

Cada uma dessas páginas usa `alternates.canonical` apontando para o próprio
path (relativo, resolvido via `metadataBase`), e `openGraph.title`/
`openGraph.description` sobrescrevendo apenas esses dois campos herdados do
root layout.

### 4. Project Details (`app/(public)/portfolio/[slug]/page.tsx`)

- Criar rota dinâmica de segmento `portfolio/[slug]/page.tsx` como Server
  Component stub, sem `generateStaticParams` (fora de escopo — sem dados
  reais da API ainda).
- Implementar `generateMetadata` assíncrono recebendo `params.slug`,
  retornando um `Metadata` placeholder controlado (ex.: title genérico do
  tipo `Project — CarShop`, sem interpolar dado fictício de negócio como se
  fosse real), com comentário `TODO` explícito indicando o ponto de
  integração futura com a API de projetos.
- `openGraph.type: 'article'` nesse `generateMetadata`, sem `images`
  (omitir até existir asset real).
- Sem `alternates.canonical` fixo hardcoded de exemplo — se incluído, deve
  ser derivado do `slug` recebido, nunca um valor de projeto inventado.
- Criar teste correspondente (`[slug]/page.test.tsx`) cobrindo o
  render do stub com um `slug` de exemplo fictício/neutro.

### 5. Admin — reforço de não indexação

- Editar `app/(admin)/admin/page.tsx` (ou `layout.tsx`, conforme onde o
  `metadata` já existe/deveria existir — verificar se admin já exporta
  `metadata`; se não exportar, adicionar) para incluir
  `metadata.robots = { index: false, follow: false }` diretamente na
  página/layout admin (defesa em profundidade além do `robots.ts` global).
- Ajustar teste correspondente se necessário para refletir a exportação de
  metadata (sem quebrar os testes existentes de admin).

### 6. `app/robots.ts`

- Criar `app/robots.ts` exportando a função default que retorna:
  - `rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/admin/'] }`
  - `sitemap`: URL absoluta construída a partir de
    `clientEnv.NEXT_PUBLIC_SITE_URL` + `/sitemap.xml`.
- Criar teste unitário cobrindo o shape retornado (regras e URL do sitemap).

### 7. `app/sitemap.ts`

- Criar `app/sitemap.ts` com entradas estáticas para `/`, `/about`,
  `/services`, `/portfolio`, `/contact`, cada uma com `url` absoluta
  (base em `clientEnv.NEXT_PUBLIC_SITE_URL`), `lastModified` e
  `changeFrequency` apropriados ao tipo de conteúdo (ex. `monthly`/`weekly`,
  sem inventar frequência de negócio não documentada — usar um valor neutro
  razoável e documentável).
- Excluir explicitamente `/admin` e qualquer rota futura de auth.
- Não incluir entradas de `portfolio/[slug]` — adicionar comentário `TODO`
  no arquivo explicando que isso depende da API de projetos existir
  (listagem de slugs reais), conforme decisão do `architect`.
- Criar teste cobrindo as entradas esperadas do sitemap.

### 8. Documentação da estratégia de renderização/cache

- Adicionar (ou estender, se já existir um doc de rendering geral) um
  documento curto registrando, por página (Home, About, Services,
  Portfolio listagem, Project Details, Contact, Admin): tipo de rendering
  (estático/SSG hoje, candidato a ISR/`revalidate` quando a API existir),
  Server vs Client Component e justificativa, e política de
  cache/revalidation (nada autenticado/sensível cacheado como público).
  Local sugerido: `docs/rules/rendering.md` (estender, não duplicar) ou um
  novo arquivo referenciado a partir dele — decisão de organização do
  `developer`, desde que não crie uma segunda fonte de verdade conflitante
  com `docs/rules/rendering.md`.

### 9. Validação final

- Rodar lint, typecheck e build (`next build`) — devem passar sem erros,
  incluindo a validação Zod da nova env var em tempo de build/teste.
- Rodar a suíte de testes (Vitest + Testing Library) cobrindo todos os
  arquivos novos/alterados.
- Auditoria SEO básica (Lighthouse ou equivalente) nas páginas públicas
  agora existentes, registrando o resultado informalmente (não é gate de
  build) — conforme item 12 do DoD da spec.

## Arquivos a criar

- `app/(public)/about/page.tsx`, `about/page.test.tsx`
- `app/(public)/services/page.tsx`, `services/page.test.tsx`
- `app/(public)/portfolio/page.tsx`, `portfolio/page.test.tsx`
- `app/(public)/portfolio/[slug]/page.tsx`, `[slug]/page.test.tsx`
- `app/(public)/contact/page.tsx`, `contact/page.test.tsx`
- `app/robots.ts` (+ teste)
- `app/sitemap.ts` (+ teste)

## Arquivos a editar

- `app/layout.tsx` (lang, metadata, metadataBase, openGraph)
- `app/layout.test.tsx`
- `lib/env/client.ts` (nova env var)
- `lib/env/client.test.ts`
- `.env.example`
- `app/(admin)/admin/page.tsx` (ou `layout.tsx`) — `robots: { index: false, follow: false }`
- teste correspondente de admin, se afetado
- `docs/rules/rendering.md` (ou novo doc referenciado a partir dele) — estratégia de rendering/cache

## Critérios de aceite (mapeados ao DoD da spec)

| DoD (spec, escopo técnico) | Critério de aceite no código |
|---|---|
| 1. Estratégia de renderização documentada por página | Documento atualizado cobrindo Home/About/Services/Portfolio/Project Details/Contact/Admin com Server vs Client e cache/revalidation |
| 2. Metadata base via Metadata API | `export const metadata` presente em root layout e em todas as páginas estáticas listadas |
| 3. `html lang` apropriado | `app/layout.tsx` usa `lang="en-US"` |
| 4. Title/description por página sem copy de negócio | Cada stub tem `metadata.title`/`description` placeholder, resolvido via template do root layout |
| 5. `generateMetadata` de Project Details preparado para dados reais | `portfolio/[slug]/page.tsx` exporta `generateMetadata` assíncrono recebendo `params.slug`, com TODO de integração futura |
| 6. Fundação de Open Graph | Root layout define `openGraph` base; páginas estáticas sobrescrevem apenas title/description; Project Details usa `type: 'article'` sem imagem fictícia |
| 7. `robots.ts`/`sitemap.ts` | Ambos existem em `app/`, com regras/entradas conforme decisão do architect |
| 8. Canonical URLs onde aplicável | `alternates.canonical` presente nas páginas estáticas públicas |
| 9. Admin nunca indexável | `robots: { index: false, follow: false }` na página/layout admin **e** `disallow: ['/admin', '/admin/']` em `app/robots.ts` |
| 10. Sem Client Component por conveniência em conteúdo público | Nenhum stub criado usa `"use client"`; Contact documenta boundary futura isolada para o formulário |
| 11. Política de cache/revalidation documentada | Coberta no mesmo documento do item 1 |
| 12. Build/lint/typecheck passam; SEO básico avaliado | Passo 9 executado e resultado registrado |

## Riscos e dependências

- **Nova env var `NEXT_PUBLIC_SITE_URL`**: obrigatória para `metadataBase`,
  `robots.ts` e `sitemap.ts`. Sem ela definida em cada ambiente (local,
  preview, produção), o build falha na validação Zod (comportamento
  intencional de fail-fast, igual ao padrão já usado para
  `NEXT_PUBLIC_API_URL`). O `developer` não deve commitar nenhum valor real
  de produção em `.env.example`.
- **Ausência de API de projetos**: Portfolio (listagem) e Project Details
  permanecem stubs sem fetch nesta task; `generateStaticParams` e entrada de
  `portfolio/[slug]` no sitemap ficam documentados como TODO explícito, não
  implementados. Não antecipar integração — está fora de escopo por decisão
  já registrada na spec.
- **Admin metadata**: confirmar se `app/(admin)/admin/layout.tsx` ou
  `app/(admin)/admin/page.tsx` já exporta algum `metadata` antes de editar,
  para não duplicar exportações conflitantes no mesmo segmento de rota.
- **Sem copy de negócio**: todo texto novo em stubs e em `description`
  traduzido do root layout deve permanecer neutro/técnico — qualquer copy
  de marketing final é explicitamente fora de escopo (spec, seção "Fora de
  escopo").
