# Plano de implementação — CARSHOP-144

Consolida `specs/CARSHOP-144/spec.md` (NON-TRIVIAL), as decisões do usuário
sobre os Conflitos 2–7 e a decisão arquitetural do `architect`. Este plano
não introduz nenhuma decisão nova de arquitetura ou design — apenas
sequencia a implementação.

## Decisões aprovadas (entrada deste plano)

### Usuário

- **Hero (Conflito 2)**: usa a capa de um work real — o primeiro work com
  imagem `isCover`, na ordem retornada pela API. Sem capa disponível →
  Hero tipográfico (sem foto, sem placeholder).
- **Services (Conflito 3)**: seção omitida.
- **Testimonials (Conflito 4)**: omitidos; comentários de works **não** são
  usados como depoimentos.
- **CTAs (Conflito 5)**: CTA primário "View Our Work" → `/portfolio`;
  "Get a Quote" permanece desabilitado (igual ao header).
- **Idioma (Conflito 6)**: copy da Home em inglês; `category` exibida como
  vem da API.
- **Taglines (Conflito 7)**: taglines de `visual-direction.md` permitidas,
  **exceto** "Built to last".
- Omitir before/after, estatísticas/trust stats, ratings e business info.

### Architect (essencial)

- Tudo Server Component. **Nenhum** `'use client'` novo, **sem** Framer
  Motion.
- ISR via `getWorks()` existente (revalidate 3600, tags `['works']`). **Não**
  usar `force-dynamic`. Não alterar `lib/api/*`.
- Seleção determinística em função pura `selectHomeWorks` (ordem da API,
  somente works com capa, hero = primeiro, featured = próximos 3).
- Degradação silenciosa em erro/vazio: `console.error`, Hero tipográfico,
  "Our Work" omitida, sem `ErrorToast`, sem mensagem de estado vazio, sem
  strings pt-BR.
- Sem componentes para Services / Before-After / Stats / Testimonials /
  Business info.
- Não alterar: `WorkImageThumb`, `PageSection`/`Container`, `Button`,
  `Header`/`Footer`, `lib/api/*` (proporções editoriais via `className`
  override no uso, não no componente compartilhado).

## Bloqueios

Nenhum bloqueio impeditivo identificado pelo `architect`. As dependências
e conflitos remanescentes estão na seção "Follow-ups e conflitos
registrados" e **não** impedem a implementação.

## Arquivos

### Criar

1. `app/(public)/_lib/select-home-works.ts`
2. `app/(public)/_lib/select-home-works.test.ts`
3. `app/(public)/_components/home-cta-actions.tsx`
4. `app/(public)/_components/project-preview.tsx`
5. `app/(public)/_components/home-hero.tsx`
6. `app/(public)/_components/featured-works.tsx`
7. `app/(public)/_components/final-cta.tsx`

### Modificar

8. `app/(public)/page.tsx` (reescrita completa)
9. `app/(public)/page.test.tsx` (reescrita completa)
10. `docs/rules/rendering.md` (linha da Home, ~linha 26)

### Não alterar (validar que continuam passando)

`components/gallery/work-image-thumb.tsx`, `components/layout/page-section.tsx`,
`components/layout/container.tsx`, `components/ui/button.tsx`,
`components/layout/header.tsx`, `components/layout/footer.tsx`,
`lib/api/works.ts` e demais de `lib/api/*`.

## Sequência de implementação

### 1. Seleção de works — `app/(public)/_lib/select-home-works.ts`

- Tipo exportado `HomeWork = { work: Work; image: WorkImage }`.
- Função pura `selectHomeWorks(works: Work[]): { hero: HomeWork | null; featured: HomeWork[] }`.
- `withCover`: mapear works via `getCoverImage` (helper existente),
  preservando a ordem da API e **pulando** works sem capa.
- `hero = withCover[0] ?? null`; `featured = withCover.slice(1, 4)` (máx. 3,
  hero nunca repetido).
- Sem inferências de campo inexistente (`featured`, before/after etc.).
- Importar tipos/helpers existentes; não modificar `lib/api/works.ts`.

### 2. `HomeCtaActions` — `app/(public)/_components/home-cta-actions.tsx`

- `Button asChild` + `Link href="/portfolio"` com texto "View Our Work"
  (variante default).
- `Button variant="outline"` "Get a Quote" com `disabled`,
  `aria-disabled="true"` e `aria-label="Get a Quote (coming soon)"`, igual
  ao header (CARSHOP-143).
- Ambos com `size="lg"` e `className="h-11 px-6"` (alvo de toque ≥44px —
  override local, sem alterar `button.tsx`).
- Reutilizado no Hero e no Final CTA.

### 3. `ProjectPreview` — `app/(public)/_components/project-preview.tsx`

- Props: `{ item: HomeWork; emphasis: 'dominant' | 'supporting' }`.
- Um único `Link` para `/portfolio/[slug]` com `aria-label={work.title}`
  envolvendo: imagem, `category` (`text-label`) e título `h3`
  (`text-heading-3`).
- Imagem via `WorkImageThumb` com `fill`, aspecto 4:3 via `className`,
  lazy (sem `priority`), `alt = image.alt || work.title`.
- `sizes`:
  - dominant: `"(min-width: 1280px) 750px, (min-width: 1024px) 66vw, 100vw"`
  - supporting: `"(min-width: 1280px) 370px, (min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"`
- Hover: wrapper `overflow-hidden`, imagem com
  `group-hover:scale-[1.02] transition-transform motion-reduce:transform-none`.
- Foco: `focus-visible:ring-3 focus-visible:ring-ring/50`.
- Sem sombras genéricas, gradientes, glass ou overlay de texto sobre foto.

### 4. Hero — `app/(public)/_components/home-hero.tsx`

- Props: `{ hero: HomeWork | null }`.
- `<section aria-labelledby="home-hero-heading">` com `PageSection
  spacing="compact"`.
- `h1#home-hero-heading` `text-display-xl`: "Crafted for your car. Built for
  the road."
- Linha de suporte `text-body-lg text-secondary-foreground`:
  "Upholstery · Restoration · Custom Work".
- Ações: `HomeCtaActions`.
- **Modo imagem** (hero ≠ null):
  - `<figure>` com `WorkImageThumb` (`fill`, aspecto 4:3 via `className`,
    `priority` — **único** `priority` da página),
    `sizes="(min-width: 1280px) 660px, (min-width: 1024px) 55vw, 100vw"`.
  - `<figcaption>`: `category` (`text-label`) + link para
    `/portfolio/[slug]` com o título e `LuArrowRight` `aria-hidden`.
  - Nenhum texto sobreposto à foto.
  - Layout: mobile/tablet coluna única na ordem h1 → suporte → ações →
    imagem; `lg`: grid de 12 colunas, texto `col-span-5`, imagem
    `col-span-7`, `items-center`. Sem `100vh`.
- **Modo tipográfico** (hero = null): coluna única, largura máxima ~9/12
  colunas, sem imagem nem placeholder.

### 5. Our Work — `app/(public)/_components/featured-works.tsx`

- Props: `{ featured: HomeWork[] }`. Renderizado pela página **somente** se
  `featured.length >= 1`.
- `<section aria-labelledby="our-work-heading">` com `PageSection
  spacing="editorial"`.
- Cabeçalho: `h2#our-work-heading` "Our Work" (`text-heading-2`) + link
  "View all projects" com `LuArrowRight` (`aria-hidden`) → `/portfolio`;
  empilhado no mobile, inline `justify-between items-end` em `lg`.
- Lista `<ul>`/`<li>` de `ProjectPreview`: primeiro item `dominant`,
  demais `supporting`.
- Grid:
  - mobile: empilhado, 4:3;
  - `md`: dominante em largura total + supporting em `md:grid-cols-2`;
  - `lg`: dominante `lg:col-span-8`, supporting empilhados em
    `lg:col-span-4`;
  - `gap-4 lg:gap-8`.

### 6. Final CTA — `app/(public)/_components/final-cta.tsx`

- `<section aria-labelledby="final-cta-heading">` com `PageSection
  spacing="standard"` e `border-t border-border`.
- `h2#final-cta-heading` `text-display-lg`: "Ready to transform your
  interior?" + `HomeCtaActions`.
- Alinhado à esquerda. Sem "Free", sem business info.

### 7. Página — `app/(public)/page.tsx`

- Server Component `async`, sem `'use client'`, sem `force-dynamic`.
- `metadata` estática:
  - `description`: "Automotive upholstery, restoration and custom interior work."
  - `alternates.canonical`: `new URL('/', clientEnv.NEXT_PUBLIC_SITE_URL).toString()`
  - `openGraph`: title/description coerentes.
- Dados: `try { works = await getWorks() } catch (error) { console.error(...); works = [] }`.
- `const { hero, featured } = selectHomeWorks(works)`.
- Render: `HomeHero` → `FeaturedWorks` (somente se `featured.length >= 1`)
  → `FinalCta`.
- Sem `ErrorToast`, sem mensagem de vazio, sem strings pt-BR.

### 8. Documentação — `docs/rules/rendering.md`

- Atualizar a linha da Home (~linha 26): Home passa a ser ISR via
  `getWorks()` (revalidate 3600, tag `works`), com degradação silenciosa
  (erro/vazio → Hero tipográfico e "Our Work" omitida) e a regra de seleção
  (works com capa na ordem da API; hero = primeiro; featured = próximos 3).

## Plano de testes

Padrão: Vitest + Testing Library, com `vi.mock('server-only')` e mock de
`getWorks`; página testada com `await` do Server Component, no mesmo estilo
de `app/(public)/portfolio/page.test.tsx`.

### `app/(public)/_lib/select-home-works.test.ts`

- Preserva a ordem da API.
- Pula works sem capa.
- Limita `featured` a 3.
- Hero não aparece em `featured`.
- Lista vazia → `{ hero: null, featured: [] }`.
- Um único work com capa → hero definido, `featured` vazio.

### `app/(public)/page.test.tsx` (reescrita)

- **Sucesso (≥5 works com capa)**: exatamente um `h1`; somente a imagem do
  hero tem `fetchpriority="high"`; 3 links de projeto em "Our Work"
  (excluindo o hero); "View all projects" e "View Our Work" apontam para
  `/portfolio`; "Get a Quote" desabilitado; `h2` "Our Work" presente.
- **Works sem capa**: são pulados.
- **Uma única capa**: hero com imagem, sem seção "Our Work".
- **Lista vazia**: nenhuma `img`, sem "Our Work", Hero e Final CTA
  presentes, toast não chamado.
- **Erro em `getWorks`**: mesmo resultado do vazio + `console.error`
  chamado (espionado/silenciado no teste).
- **Metadata**: canonical correto.
- **Guardas de copy**: ausência de "Built to last", de "Free" e de strings
  de estado em pt-BR.

### Regressão

- Testes existentes de galeria (`WorkImageThumb`) e portfolio devem
  continuar passando sem alteração.
- Cobertura ≥ 80% no código novo/alterado.
- `lint`, `typecheck`, `build` e suíte de testes passando. Nenhum `any`,
  `as any`, `@ts-ignore`, `@ts-expect-error` ou cast inseguro.

## Verificação manual (dev server)

Subir o dev server e validar a Home na app rodando:

- **Mobile (~375px)**: ordem h1 → suporte → ações → imagem; CTAs visíveis e
  com alvo ≥44px; "Our Work" empilhado em 4:3; sem overflow horizontal.
- **Tablet (`md`, ~768px)**: dominante em largura total + dois supporting
  lado a lado.
- **Desktop (`lg`, ≥1024px, e também ~1280px)**: Hero em 5/7 colunas;
  "Our Work" com dominante 8 colunas + supporting empilhados em 4.
- **DevTools**: conferir larguras renderizadas vs. `sizes` (hero,
  dominant, supporting) e ajustar se houver divergência relevante; apenas
  a imagem do hero com `priority`/`fetchpriority="high"`; sem CLS visível.
- **Teclado**: foco visível em links/botões; "Get a Quote" não focável/
  acionável como ação; um único `h1`, headings em ordem.
- **Degradação**: com API indisponível (ou sem works com capa), a Home
  renderiza Hero tipográfico + Final CTA, sem erro 500.
- `prefers-reduced-motion`: sem scale no hover.

## Critérios de aceite mapeados ao DoD

| Critério (resumo) | Como o plano atende |
| --- | --- |
| Hero com hierarquia forte e CTA claro | `h1` `text-display-xl`, CTA primário real "View Our Work" → `/portfolio`, "Get a Quote" desabilitado (passos 2 e 4) |
| Sem padrões SaaS (cards de serviços, grid uniforme) | Services omitida; Our Work com composição dominante + apoio (passo 5) |
| Our Work com works reais e links funcionais | `selectHomeWorks` + `ProjectPreview` → `/portfolio/[slug]`, "View all projects" → `/portfolio` |
| Nada inventado | Sem before/after, stats, ratings, testimonials, business info; sem "Free"/"Built to last" (guardas de copy) |
| Imagem correta (`sizes`, sem CLS, `priority` só no crítico) | Aspecto 4:3 reservado, `sizes` por ênfase, `priority` apenas no hero |
| Erro/vazio não quebra a Home | try/catch + degradação silenciosa, testada |
| Responsivo e acessível | Verificação manual em mobile/md/lg; `aria-labelledby` por seção, um `h1`, foco visível, alvos ≥44px |
| Lint/typecheck/build/testes, cobertura ≥80% | Plano de testes acima |

## Follow-ups e conflitos registrados (não implementar agora)

1. **Ordenação de `GET /works` indefinida no contrato**: hero/featured
   dependem da ordem da API. Follow-up: campo `featured` (ou ordenação
   explícita) no backend.
2. **Sem metadado de ponto focal** nas imagens: crop 4:3 com `object-center`
   pode cortar detalhes. Mitigação atual: proporção 4:3.
3. **`Button` sem tamanho ≥44px** em `components/ui`: override local
   `h-11 px-6`. Follow-up: variante de tamanho no design system.
4. **`priority` do `next/image` deprecado no Next 16**: usar como está;
   follow-up para migrar para `preload`.
5. **Final CTA diverge de `docs/design/`** ("Get a Free Quote" + business
   info) por falta de dados/fluxo reais; registrado como desvio consciente.
6. **LCP no mobile provavelmente é o `h1`**, não a imagem do hero —
   observar na verificação, sem ação obrigatória.
7. **"Get a Quote" sem destino** (herdado de CARSHOP-143): permanece
   desabilitado até existir fluxo aprovado.

## Fora de escopo (reforço)

- Alterar `lib/api/*`, cache/ISR/tags, endpoints ou Route Handlers.
- Alterar Header/Footer/MobileNav, `WorkImageThumb`, `Button`,
  `PageSection`/`Container`.
- Seções Services, Before & After, Stats, Testimonials, Business info (nem
  componentes vazios).
- Framer Motion / parallax.
- Imagens de stock/IA.
