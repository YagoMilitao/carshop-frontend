# Plano de implementação — CARSHOP-145

Consolida `specs/CARSHOP-145/spec.md` (NON-TRIVIAL), as decisões do usuário
sobre os Conflitos 1–4 e a decisão arquitetural do `architect` (Conflitos 5
e 6 e pontos menores). Este plano não introduz nenhuma decisão nova de
arquitetura ou design — apenas sequencia a implementação.

Branch: `feat/CARSHOP-145`, **empilhada sobre `feat/CARSHOP-144`** (escolha
do usuário).

## Decisões aprovadas (entrada deste plano)

### Usuário

- **Idioma (Conflito 1)**: traduzir para inglês as mensagens de erro/vazio de
  `/portfolio`, o `error.tsx` e a metadata `description`/`openGraph.description`.
  Manter title, canonical e estrutura OG. `category` exibida como vem da API.
- **Helper de teste (Conflito 2)**: parametrizar o texto do botão em
  `error-boundary.test-helpers.tsx`; **não** alterar `[slug]/error.tsx`.
  Idioma de Project Details = follow-up.
- **Works sem capa (Conflito 3)**: sem `isCover` → primeira imagem pelo menor
  `order`; sem nenhuma imagem → entrada somente texto, sem placeholder falso.
  Resolvido apenas na camada de apresentação.
- **Loading (Conflito 4)**: criar `loading.tsx` com skeleton, sem alterar a
  estratégia de rendering.

### Architect (essencial)

- **Server vs Client**: tudo Server Component. Os únicos Client Components
  continuam sendo `portfolio/error.tsx` e `ErrorToast`. `loading.tsx` é
  Server Component (sem `'use client'`).
- **Composição**: um único `<ul>` `grid grid-cols-1 md:grid-cols-2
  lg:grid-cols-12 items-start`; ordem no DOM = ordem da API; **sem** CSS
  `order`. Papéis atribuídos pela função pura `buildPortfolioLayout`:
  - item 1 → `lead` (`md:col-span-2 lg:col-span-12`, frame `banner` = 4:3
    no mobile → 16:9 a partir de `md`; única imagem `priority`/LCP);
  - itens 2..N em pares: par par → `[wide, narrow]` (lg 7/5); par ímpar →
    `[narrow, wide]` (lg 5/7);
  - `wide` → frame `editorial` (4:3); `narrow` → frame `detail` (4:3 até
    `lg`, 3:4 em `lg`);
  - último item sem par → `solo` (`md:col-span-2 lg:col-span-8`, alinhado à
    esquerda, frame `editorial`).
  - Referência: N=1 lead; N=2 lead+solo; N=3 lead+7/5; N=4 lead+7/5+solo;
    N=5 lead+7/5+5/7.
  - Gaps: `gap-y-12 md:gap-y-16 lg:gap-y-24`; `md:gap-x-6 lg:gap-x-8`;
    imagem→texto `gap-4`. Sem proporções quadradas. `object-cover`
    centralizado (limitação conhecida).
- **Works sem imagem**: segundo `<ul>` tipográfico após o grid
  (`border-t`/`divide-y`, sem heading de grupo, sem placeholder) —
  reordenação consciente para o final.
- **Conteúdo do preview**: imagem, `category` (`text-label
  text-muted-foreground`), título como `h2`; `Link` único com
  `aria-label={work.title}`. Título do lead `text-heading-2`, demais
  `text-heading-3`. `description` apenas no lead (`line-clamp-3`; em `lg`
  split: título `col-span-6`, descrição `col-start-8 col-span-5`) e nas
  entradas somente texto (`line-clamp-2`), `text-body
  text-secondary-foreground`. Sem tags, sem datas. Hover:
  `motion-safe:group-hover:scale-[1.02]` + `motion-reduce:transition-none`
  na imagem, título `group-hover:text-primary`; foco `focus-visible:ring-3
  ring-ring/50`; sem fundo/borda/sombra.
- **Header**: `h1` "Portfolio" (`text-display-lg`) + intro (`text-body-lg
  text-secondary-foreground`) "Upholstery, restoration and custom interior
  projects by CarShop."; sem eyebrow. `PageSection spacing="compact"`; lista
  começa em `mt-10 lg:mt-16`.
- **Metadata**: apenas `description` e `openGraph.description` mudam para a
  string da intro.
- **`ProjectPreview`**: generalizado **no lugar**
  (`app/(public)/_components/project-preview.tsx`). HTML da Home deve ficar
  idêntico.

## Bloqueios

Nenhum bloqueio impeditivo identificado pelo `architect`. Riscos e
follow-ups estão registrados ao final e **não** impedem a implementação.

Ponto a confirmar com o usuário **somente se** o `reviewer` considerar
bloqueante: o `portfolio/loading.tsx` também envolve `[slug]` (ver Risco 1).
Nesse caso, escalar ao usuário — não mudar a estrutura de rotas por conta
própria.

## Arquivos

### Criar

1. `app/(public)/portfolio/_lib/resolve-preview-image.ts`
2. `app/(public)/portfolio/_lib/resolve-preview-image.test.ts`
3. `app/(public)/portfolio/_lib/build-portfolio-layout.ts`
4. `app/(public)/portfolio/_lib/build-portfolio-layout.test.ts`
5. `app/(public)/portfolio/_components/portfolio-header.tsx`
6. `app/(public)/portfolio/_components/portfolio-state-message.tsx`
7. `app/(public)/portfolio/_components/portfolio-grid.tsx`
8. `app/(public)/portfolio/_components/portfolio-text-entry.tsx`
9. `app/(public)/portfolio/loading.tsx`
10. `app/(public)/portfolio/loading.test.tsx`

### Modificar

11. `app/(public)/_components/project-preview.tsx` (generalização)
12. `app/(public)/_components/project-preview.test.tsx`
13. `app/(public)/_components/featured-works.tsx` (recebe o mapa de `sizes`)
14. `app/(public)/portfolio/page.tsx` (reescrita da apresentação)
15. `app/(public)/portfolio/page.test.tsx` (reescrita, em inglês)
16. `app/(public)/portfolio/error.tsx` (inglês + sistema visual público)
17. `app/(public)/portfolio/error.test.tsx`
18. `app/(public)/portfolio/error-boundary.test-helpers.tsx` (opção
    `retryButtonText`)
19. `app/(public)/portfolio/[slug]/error.test.tsx` (apenas passar
    `'Tentar novamente'` explicitamente)
20. `docs/rules/rendering.md` (nota do `loading.tsx` na linha da listagem)

### Não alterar (validar que continuam passando)

`components/gallery/work-image-thumb.tsx`, `components/layout/page-section.tsx`,
`components/layout/container.tsx`, `ErrorToast`, `components/ui/*`,
`lib/api/*`, `app/(public)/_lib/select-home-works.ts`,
`app/(public)/_components/home-hero.tsx`, `app/(public)/portfolio/[slug]/*`
(exceto o parâmetro no `[slug]/error.test.tsx`), `sitemap.ts`.

## Sequência de implementação

### 1. `ProjectPreview` generalizado — `app/(public)/_components/project-preview.tsx`

- Exportar `type ProjectPreviewItem = { work: Work; image: WorkImage }`.
- `type ProjectPreviewFrame = 'editorial' | 'banner' | 'detail'`, mapeado
  por um `Record` fixo de classes (sem `className` arbitrário):
  `editorial` 4:3; `banner` 4:3 → `md` 16:9; `detail` 4:3 → `lg` 3:4.
- Props: `{ item; sizes: string; frame?: ProjectPreviewFrame = 'editorial';
  headingLevel?: 2 | 3 = 3; lead?: boolean = false; priority?: boolean =
  false }`.
- **Remover** `emphasis`. `lead` → título `text-heading-2` + `description`
  (`line-clamp-3`, split em `lg` conforme decisão); demais → `text-heading-3`,
  sem descrição.
- Mantém `Link` único, `aria-label={work.title}`, `alt = image.alt ||
  work.title`, hover/foco conforme decisão, lazy por padrão (`priority` só
  quando passado).
- `HomeWork` continua existindo e deve ser estruturalmente compatível com
  `ProjectPreviewItem`.

### 2. Home sem mudança visual — `app/(public)/_components/featured-works.tsx`

- Mover para cá o mapa `sizesByEmphasis` com as **strings idênticas** às
  atuais (dominant/supporting) e passar `sizes` explicitamente.
- Defaults do preview (frame `editorial`, `h3`, lazy) garantem HTML idêntico
  ao atual. Rodar os testes de `featured-works`, `home-hero`, Home
  (`app/(public)/page.test.tsx`) e `select-home-works` sem alteração.

### 3. Resolução de imagem — `app/(public)/portfolio/_lib/resolve-preview-image.ts`

- `resolvePreviewImage(work): WorkImage | null` → `getCoverImage(work)` ??
  imagem de menor `order` (sem mutar `work.images`) ?? `null`.
- Não alterar `getCoverImage` nem `lib/api/*`.

### 4. Layout — `app/(public)/portfolio/_lib/build-portfolio-layout.ts`

- Função pura `buildPortfolioLayout(works) => { entries: { item:
  ProjectPreviewItem; role: 'lead' | 'wide' | 'narrow' | 'solo' }[];
  textOnly: Work[] }`.
- Usa `resolvePreviewImage`; works sem imagem vão para `textOnly`; demais
  recebem papéis conforme a regra de composição (lead, pares alternados,
  solo final). Preserva a ordem da API.

### 5. Componentes da listagem — `app/(public)/portfolio/_components/`

- `portfolio-header.tsx`: `h1` "Portfolio" + intro (copy exata acima).
  Reutilizado por `page.tsx`, `error.tsx` e `loading.tsx`.
- `portfolio-state-message.tsx`: bloco à esquerda, `max-w-xl`, `h2`
  `text-heading-3` + `p` `text-body text-secondary-foreground` + slot de ação.
- `portfolio-grid.tsx`: `<ul>` com as classes de grid/gaps da decisão;
  `Record<role, { frame, sizes, span, lead }>`; `ProjectPreview
  headingLevel={2}`; `priority` somente no `lead`. `sizes`:
  - lead: `"(min-width: 1280px) 1120px, (min-width: 1024px) calc(100vw - 128px), 100vw"`
  - wide: `"(min-width: 1280px) 640px, (min-width: 1024px) 55vw, (min-width: 768px) 50vw, 100vw"`
  - narrow: `"(min-width: 1280px) 450px, (min-width: 1024px) 40vw, (min-width: 768px) 50vw, 100vw"`
  - solo: `"(min-width: 1280px) 704px, (min-width: 1024px) 66vw, 100vw"`
- `portfolio-text-entry.tsx`: `Link` único com `category` + `h2` +
  `description` (`line-clamp-2`) + `LuArrowRight` (`aria-hidden`); em `lg`,
  linha de 12 colunas (label 3 / texto 7 / seta 2); alvo ≥ 44px.

### 6. Página — `app/(public)/portfolio/page.tsx`

- Continua Server Component `async`, `getWorks()` em `try/catch`, sem
  `revalidate`/`dynamic` próprios, `href` `/portfolio/${slug}`.
- `metadata`: somente `description` e `openGraph.description` passam para a
  string da intro; title, canonical e estrutura OG inalterados.
- `PageSection spacing="compact"` → `PortfolioHeader` → conteúdo com
  `mt-10 lg:mt-16`:
  - **Sucesso**: `PortfolioGrid` (se houver `entries`) + `<ul>` de
    `PortfolioTextEntry` (se houver `textOnly`), `border-t`/`divide-y`, sem
    heading de grupo.
  - **Erro**: manter `ErrorToast` + bloco inline; mesma string no toast e no
    `p`: "We couldn't load the portfolio right now. Please try again in a few
    moments."; `h2` "We couldn't load the portfolio"; ação `Link` "/" "Back to
    home" (`min-h-11`, `text-nav`, `LuArrowRight` `aria-hidden`); **sem**
    botão de retry; `console.error` em inglês.
  - **Vazio**: `h2` "No projects published yet", `p` "Published projects will
    appear here.", ação "Back to home".

### 7. Error boundary — `app/(public)/portfolio/error.tsx`

- Mantém `'use client'`. Reutiliza `PortfolioHeader` + bloco de estado.
- `Button size="lg" className="h-11 px-6"` "Try again" → `reset()`, mais o
  link "Back to home". Toast com a mesma string amigável do erro inline.

### 8. Loading — `app/(public)/portfolio/loading.tsx`

- Server Component, **sem** `'use client'`.
- Header real + skeleton espelhando lead (`aspect-4/3 md:aspect-video`) e um
  par 7/5 (`aspect-4/3` e `aspect-4/3 lg:aspect-3/4`), com as mesmas classes
  de grid/gaps e barras de label/título.
- `Skeleton` `rounded-lg` + `motion-reduce:animate-none`; blocos
  `aria-hidden`; `<p role="status" className="sr-only">Loading projects…</p>`;
  sem `aria-busy`.

### 9. Helper de teste e `[slug]`

- `error-boundary.test-helpers.tsx`: nova opção `retryButtonText` (usada no
  nome do botão e no título do `it`).
- `[slug]/error.test.tsx`: passa `'Tentar novamente'` explicitamente;
  `[slug]/error.tsx` **não** muda.

### 10. Documentação — `docs/rules/rendering.md`

- Na linha da listagem `/portfolio`: registrar o `loading.tsx` com skeleton;
  estratégia de rendering inalterada (Server Component + ISR 1h).
- Nota "Portfolio Grid" em `docs/design/components.md` é opcional e fica a
  cargo do `reviewer`/`knowledge-manager` — não fazer nesta implementação.

## Plano de testes

Padrão: Vitest + Testing Library, `vi.mock('server-only')`, mock de
`getWorks` mantendo `getCoverImage` real; página testada com `await` do
Server Component.

### `app/(public)/portfolio/page.test.tsx` (reescrita, em inglês)

- `h1` "Portfolio" + intro.
- N = 1, 2, 3, 5: contagem de links, `href`s `/portfolio/${slug}`, um `h2`
  por título.
- Fallback por `order` quando não há capa.
- Work sem imagens aparece na lista de texto, sem `img`.
- Apenas a primeira imagem não é lazy (`priority`); `sizes` do lead.
- Erro: toast + texto + nenhum link de projeto + "Back to home".
- Vazio: mensagens + "Back to home".
- Metadata: title, canonical, OG title e nova description.

### Unitários

- `build-portfolio-layout.test.ts`: papéis para N = 0..6, alternância 7/5 ↔
  5/7, `solo` final, separação de `textOnly`.
- `resolve-preview-image.test.ts`: capa preferida, desempate por `order`,
  `null` sem imagens, sem mutação do array.

### Preview e Home

- `project-preview.test.tsx`: substituir `emphasis` por `sizes`; `frame` →
  classe de aspecto; `headingLevel` 2/3; `lead` (`text-heading-2` +
  descrição); `priority`; fallback de `alt`.
- `featured-works`, `home-hero`, Home page e `select-home-works`: passam
  **sem alteração**.

### Estados

- `portfolio/error.test.tsx`: em inglês, `headingText: 'Portfolio'`,
  `retryButtonText: 'Try again'`.
- `[slug]/error.test.tsx`: passa com `'Tentar novamente'` explícito.
- `loading.test.tsx`: sem `'use client'`, `h1` "Portfolio", `role="status"`,
  skeletons `aria-hidden`.

### Qualidade

- Cobertura ≥ 80% no código novo/alterado.
- `lint`, `typecheck`, `build` e suíte de testes passando. Nenhum `any`,
  `as any`, `@ts-ignore`, `@ts-expect-error` ou cast inseguro.
- `next build`: `/portfolio` continua `○` com ISR 1h.

## Verificação manual (dev server)

Subir o dev server e validar `/portfolio` na app rodando:

- **Mobile (~375px)**: 1 coluna, todas as imagens 4:3, lista de texto
  empilhada, links ≥ 44px, ordem de leitura linear, sem overflow horizontal.
- **Tablet (`md`, ~768px)**: lead e solo em largura total, lead 16:9; pares
  em 2 colunas iguais 4:3.
- **Desktop (`lg` ≥1024px e ~1280px)**: 12 colunas, alternância 7/5 ↔ 5/7,
  narrow 3:4, solo em 8 colunas, split título/descrição no lead.
- **DevTools**: larguras renderizadas vs. `sizes` por papel; apenas a imagem
  do lead com `fetchpriority="high"`; sem CLS.
- **Navegação**: cada preview leva a `/portfolio/[slug]` corretamente.
- **Teclado/a11y**: foco visível, um único `h1`, `h2` por work/estado,
  um link por preview.
- **Estados**: API indisponível → bloco de erro sem 500; `error.tsx` com
  "Try again"; skeleton de loading sem animação sob `prefers-reduced-motion`.
- **Crop 3:4 do narrow**: observar fotos reais (ver Risco 2).

## Critérios de aceite mapeados ao DoD

| Critério (resumo) | Como o plano atende |
| --- | --- |
| 1. `getWorks`/`getCoverImage` sem mudança em `lib/api` | Passos 3 e 6; fallback só na apresentação |
| 2. Fotografia dominante, sem grid uniforme de cards | Composição lead + pares assimétricos + solo, sem fundo/borda/sombra (passos 4–5) |
| 3. Link único por preview → `/portfolio/${slug}` | `ProjectPreview`/`PortfolioTextEntry` com `aria-label`; testes + verificação manual |
| 4. Estados no mesmo sistema visual e idioma | `PortfolioStateMessage`, `error.tsx`, `loading.tsx` em inglês (passos 5–8) |
| 5. Sem quadrado por padrão; proporções por papel | Frames `banner`/`editorial`/`detail` (16:9, 4:3, 3:4) |
| 6. `sizes`, `priority` só no LCP, lazy, sem CLS | `sizes` por papel, `priority` só no lead, aspect-ratio fixo |
| 7. Responsivo e acessível | Verificação manual mobile/md/lg; headings, foco, 44px, motion-safe |
| 8. Metadata e rendering sem regressão | Só `description`/OG description mudam; Server Component + ISR; `[slug]`/sitemap intactos |
| 9. Lint/typecheck/build/testes, cobertura ≥80% | Plano de testes acima, incluindo Home e `[slug]` |

## Riscos e follow-ups registrados (não implementar agora)

1. **`portfolio/loading.tsx` também envolve `[slug]`**: slugs gerados sob
   demanda podem exibir brevemente o skeleton da listagem. Follow-up:
   `[slug]/loading.tsx` na task de Project Details. Alternativa rejeitada:
   mover a listagem para o route group `portfolio/(listing)/`. Se o
   `reviewer` considerar bloqueante, escalar ao usuário.
2. **Crop cego 3:4 no `narrow` em `lg`**: se fotos reais cortarem mal, trocar
   o frame `detail` para 4:3 (token único). Focal point/dimensões são
   dependência de backend.
3. **Conflito com a CARSHOP-144 não mergeada** em `project-preview`/
   `featured-works`: rebase se a 144 mudar; saída da Home deve continuar
   idêntica.
4. **Pré-existente**: o ISR pode cachear o erro capturado até o revalidate —
   motivo de não haver retry inline na página.
5. **`[slug]` e categorias permanecem em pt-BR**: follow-up de idioma de
   Project Details (erro e comentários).
6. **Works sem imagem reordenados para o final**: decisão consciente.
7. **`priority` do `next/image` deprecado no Next 16**: fora de escopo.

## Fora de escopo (reforço)

- Project Details (`/portfolio/[slug]`), exceto o parâmetro no teste do
  helper.
- `lib/api/*`, cache/ISR/tags, `force-dynamic`, Route Handlers, contrato do
  backend, campos novos no backend.
- Filtros, busca, paginação; tags e datas no preview.
- Alterações em `WorkImageThumb`, `PageSection`/`Container`, `components/ui/*`,
  Header/Footer, habilitar "Get a Quote".
- Imagens stock/IA ou placeholders apresentados como trabalho real.

## Post-review amendment (user decision, 2026-09-24)

The reviewer measured in production (`next start`) that `app/(public)/portfolio/loading.tsx`
wraps `/portfolio/[slug]` in a Suspense boundary: streaming starts before `notFound()`, so
unknown slugs return **HTTP 200 (soft-404)** instead of 404, and project pages ship the
listing skeleton (`h1` "Portfolio", "Loading projects…") in their initial HTML. Adding
`[slug]/loading.tsx` does not fix it. It also made `/portfolio` itself stream its content
inside `<div hidden>`.

**Decision (user):** remove `loading.tsx` and `loading.test.tsx` (step 8 above is withdrawn).
Loading UX relies on the route being static/ISR plus `Link` prefetch; error and empty states
remain in the new visual system. The route-group alternative (`portfolio/(listing)/`) was
rejected. `docs/rules/rendering.md` records why no segment-level loading boundary exists there.
