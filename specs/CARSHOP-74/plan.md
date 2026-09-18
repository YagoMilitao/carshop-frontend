# Plano de implementação — CARSHOP-74

Criar design tokens/utilitários base (container, spacing, theme)

## Contexto

O tema atual em `app/globals.css` usa a paleta default do shadcn (grayscale
oklch) e a fonte `Geist` em `app/layout.tsx`, em vez da paleta e tipografia
do Design System CarShop (`docs/design/colors.md`,
`docs/design/typography.md`). Não existem componentes de layout
reutilizáveis (`Container`, `PageSection`); `components/layout/header.tsx` e
`components/layout/footer.tsx` usam container ad-hoc
(`mx-auto max-w-6xl px-4`), e o Admin usa outro container ad-hoc
(`mx-auto max-w-3xl px-4 py-8`, fora de escopo). As 5 páginas públicas
(`page.tsx`, `about`, `services`, `contact`, `portfolio`) são placeholders
"em construção".

O usuário já confirmou (2026-09-17) que a troca de fonte e cor base entra no
escopo desta tarefa. O `architect` já tomou as decisões estruturais e de
valores (ver spec.md e decisão transcrita na tarefa de planejamento); este
plano não reabre nenhuma dessas decisões.

## Objetivo

Estabelecer, em `app/globals.css` e `app/layout.tsx`, a base de tokens de
cor/fonte/spacing/container do Design System CarShop, e criar componentes
`Container`/`PageSection` reutilizáveis em `components/layout/`, consumidos
pela Public UI e disponíveis para a Admin UI — sem redesenhar conteúdo.

## Escopo

Incluído:

- Tokens de cor CarShop em `app/globals.css` (substituindo o tema default
  do shadcn), com remoção explícita do bloco `.dark` (não usado hoje).
- Troca de fonte (`Geist` → Barlow Condensed + Manrope) em `app/layout.tsx`,
  com ajuste do `@theme inline` e regra `h1..h6` aplicando `font-heading`.
- Tokens de container/spacing (`--layout-container-page`,
  `--layout-container-reading`) e utilitários `@utility container-page` /
  `@utility container-reading`, fora do namespace `@theme`.
- Classes semânticas de seção via componente `PageSection`
  (`section-compact`, `section-standard`, `section-editorial`), sem criar
  `section-immersive`/Hero nesta tarefa.
- Componentes `components/layout/container.tsx` e
  `components/layout/page-section.tsx` (Server Components) + testes
  unitários colocados.
- Migração de `components/layout/header.tsx` e `components/layout/footer.tsx`
  para usar `<Container variant="page">`.
- Migração das 5 páginas públicas para envolver o placeholder existente em
  `<PageSection><Container>...</Container></PageSection>`, sem alterar
  conteúdo.

Fora de escopo (não fazer nesta tarefa):

- Redesenho de conteúdo/composição de qualquer seção ou página.
- Migração das páginas Admin existentes para os novos componentes (DoD
  exige apenas que os componentes estejam disponíveis para uso no Admin).
- Criação de `tailwind.config.ts` (arquitetura é Tailwind v4 CSS-first).
- Criação de tokens especulativos: `success`/`warning`/`chart-*`/
  `sidebar-*`, `content-gap`/`cluster-gap`, `section-immersive`.
- Alterar `--destructive` (mantém valor oklch atual do shadcn, sem hex
  aprovado).

## Ordem de execução

1. **Tokens de cor** em `app/globals.css`:
   - Substituir `:root` pelos hex de `docs/design/colors.md`:
     `--background:#0C0C0C`; `--foreground:#F4F0E8`; `--card`/`--popover:
     #151515` com foreground `#F4F0E8`; `--primary:#B56A3B` (validar
     contraste AA de `--primary-foreground`; usar `#0C0C0C` e só trocar
     para `#F4F0E8` se falhar o contraste); `--secondary:#1C1B19` fg
     `#F4F0E8`; `--muted:#151515`, `--muted-foreground:#AAA59C`;
     `--accent:#1C1B19` fg `#F4F0E8`; `--border`/`--input:#302E2A`;
     `--ring:#B56A3B`.
   - Manter `--destructive` com o valor oklch atual (sem hex aprovado).
   - Remover o bloco `.dark` e o `@custom-variant dark` associado, já que
     nada o ativa hoje — documentar a remoção no commit/PR como decisão
     explícita, não acidental.
   - Garantir que todas as regras permaneçam dentro de
     `:root`/`@theme inline`/`@layer base` (nunca fora de layer).

2. **Fontes** em `app/layout.tsx` + `app/globals.css`:
   - Trocar `Geist` por `Barlow_Condensed` (weights 500/600/700, variable
     `--font-heading`) e `Manrope` (weights 400/500/600/700, variable
     `--font-sans`), via `next/font/google`.
   - `html` className: `cn("font-sans", barlowCondensed.variable,
     manrope.variable)`.
   - Corrigir `@theme inline`: `--font-heading: var(--font-heading)` (hoje
     incorretamente aliasado para `--font-sans`).
   - Adicionar em `@layer base`: `h1,h2,h3,h4,h5,h6 { @apply font-heading; }`.

3. **Tokens de container/spacing** em `app/globals.css`:
   - Declarar fora de `@theme` (namespace reservado a `@container` queries
     no Tailwind v4): `--layout-container-page:1280px;
     --layout-container-reading:45rem` (720px).
   - Expor via `@utility container-page { max-width:
     var(--layout-container-page); margin-inline:auto; }` e
     `@utility container-reading` análogo.
   - Não usar `--container-*` dentro de `@theme`.

4. **Componentes de layout** + testes colocados:
   - `components/layout/container.tsx` (Server Component, sem
     `"use client"`): props `variant?: "page" | "reading"` (default
     `"page"`), `as?: ElementType`. Aplica `container-page`/
     `container-reading` + gutters responsivos (`px-5 sm:px-8 lg:px-16
     xl:px-20`) apenas quando `variant="page"`.
   - `components/layout/page-section.tsx` (Server Component): props
     `spacing?: "compact" | "standard" | "editorial"` (default
     `"standard"`), `container?: "page" | "reading" | "none"` (default
     `"page"`, `"none"` = full-bleed), `as?: ElementType`. Renderiza
     `<section>` com classes de spacing (`compact`: `py-12 lg:py-16`;
     `standard`: `py-16 lg:py-28`; `editorial`: `py-20 lg:py-36`),
     envolvendo `children` em `<Container variant={container}>` quando
     `container !== "none"`.
   - Local: `components/layout/` (não `components/ui/`, reservado a
     primitivos shadcn CLI conforme ADR-009).
   - Testes: `container.test.tsx`, `page-section.test.tsx` (stack de
     testes oficial do projeto).

5. **Migrar `header.tsx` e `footer.tsx`**:
   - Substituir `mx-auto max-w-6xl px-4` por `<Container variant="page">`.
   - Incluído nesta task para evitar dois containers divergentes (1152px
     vs 1280px). Risco baixo — testes existentes não fazem asserção de
     `className`. `MobileNav` (Client Component) permanece isolado e não é
     alterado.

6. **Migrar as 5 páginas públicas** (`app/(public)/page.tsx`, `about`,
   `services`, `contact`, `portfolio`):
   - Envolver o `<div>` placeholder existente em
     `<PageSection><Container>...</Container></PageSection>`, preservando o
     conteúdo exatamente como está (sem alterar texto/comportamento).

7. **Admin**: não migrar `app/(admin)/admin/(protected)/page.tsx` nesta
   tarefa. Registrar como trabalho futuro — o DoD exige apenas que os
   componentes estejam disponíveis para uso no Admin UI, não a migração das
   páginas Admin existentes.

## Arquivos a criar

- `components/layout/container.tsx`
- `components/layout/page-section.tsx`
- `components/layout/container.test.tsx`
- `components/layout/page-section.test.tsx`

## Arquivos a alterar

- `app/globals.css`
- `app/layout.tsx`
- `components/layout/header.tsx`
- `components/layout/footer.tsx`
- `app/(public)/page.tsx`
- `app/(public)/about/page.tsx`
- `app/(public)/services/page.tsx`
- `app/(public)/contact/page.tsx`
- `app/(public)/portfolio/page.tsx`

## Não alterar

- `app/(admin)/**`
- `components/ui/*`
- `components/gallery/*`
- `components/feedback/*`

## Riscos e mitigações

1. **Contraste `--primary-foreground`**: precisa validação WCAG AA real
   contra `--primary:#B56A3B`. Se `#0C0C0C` falhar o contraste, trocar para
   `#F4F0E8`. Validar antes de finalizar o token.
2. **Sintaxe `@utility` com media query aninhada**: não confirmada na
   versão instalada (`tailwindcss@4.3.3`). Mitigado usando `@utility`
   apenas para `max-width`/`margin-inline`; padding responsivo resolvido
   com classes Tailwind padrão no componente `Container`, não dentro de
   `@utility`.
3. **Remoção do bloco `.dark`**: deve ser comunicada explicitamente no
   commit/PR como decisão intencional (nada o ativa hoje), não como
   remoção acidental.
4. **Migração de `header.tsx`/`footer.tsx`**: não está literalmente no DoD
   mas foi incluída pelo `architect` com justificativa (evitar dois
   containers divergentes). Reversível se o usuário discordar.
5. **Tokens `--destructive`/success/warning sem hex aprovado**: mantidos
   (destructive) ou não criados (success/warning) — não inventar valores.

## Critérios de aceite (derivados da spec/DoD)

- `app/globals.css` centraliza tokens de spacing e largura de container,
  sem valores arbitrários (`mt-[73px]` etc.) espalhados pelos componentes
  de layout.
- Existem componentes `Container`/`PageSection` reutilizáveis, testados,
  usados por pelo menos uma página pública e disponíveis para uso no Admin
  UI (sem exigir migração das páginas Admin existentes).
- As 5 páginas públicas (`page.tsx`, `about`, `services`, `contact`,
  `portfolio`) usam os novos componentes de container/layout em vez de
  larguras/paddings ad-hoc, sem alterar conteúdo ou comportamento.
- `app/globals.css` usa a paleta de cores CarShop (cognac/near-black/warm
  white, etc.) nos tokens semânticos consumidos pelos componentes, em vez
  dos valores default do shadcn.
- `app/layout.tsx` carrega Barlow Condensed e Manrope via `next/font`, e os
  componentes aplicam essas fontes conforme os papéis definidos em
  `docs/design/typography.md` (Barlow Condensed para display/headings,
  Manrope para corpo/interface).
- Todas as combinações de cor foreground/background usadas pelos
  componentes afetados atendem contraste WCAG AA (validar `--primary`/
  `--primary-foreground` explicitamente).
- `docs/rules/` (TypeScript estrito, rendering, testing) são respeitados:
  `Container`/`PageSection` são Server Components (sem `"use client"`),
  sem `any`/`as any`/`@ts-ignore`/`@ts-expect-error`.
- Nenhum segredo ou dado sensível é introduzido.
- Nenhum código fora de `:root`/`@theme inline`/`@layer base` é adicionado
  em `app/globals.css`.
