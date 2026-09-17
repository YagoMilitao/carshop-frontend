# CARSHOP-74 — Criar design tokens/utilitários base (container, spacing, theme)

## Referência

Tarefa original no Notion: CARSHOP-74 ("Criar design tokens/utilitários base
(container, spacing, theme)"). Ver Descrição, DoD e Technical Notes completos
na tarefa (URL: https://app.notion.com/2de765c3f0d480d3a518ff1892b75188).

Status: Backlog · Priority: Medium · Sprint 4 · Component: Public UI, Admin UI.

## Estado atual do repositório (investigação)

- O projeto usa **Tailwind CSS v4** (`tailwindcss@4.3.3`,
  `@tailwindcss/postcss@4.3.3`), configurado via CSS-first config
  (`@theme`/`@theme inline` dentro de `app/globals.css`). **Não existe**
  `tailwind.config.ts`/`.js` no repositório — os únicos `tailwind.config.*`
  encontrados estão em `node_modules` (stubs da própria lib).
- `app/globals.css` já define tokens semânticos via CSS custom properties
  (`--background`, `--foreground`, `--primary`, `--border`, `--radius`,
  etc.) e um bloco `@theme inline` que os expõe ao Tailwind — mas os
  **valores atuais são o tema default do shadcn (grayscale oklch)**, não a
  paleta CarShop (cognac/near-black/warm white) descrita em
  `docs/design/colors.md`.
- A tipografia atual usa a fonte `Geist` (via `next/font/google`, configurada
  em `app/layout.tsx`), não a combinação Barlow Condensed + Manrope descrita
  em `docs/design/typography.md`.
- Não existem componentes `Layout`/`Container` em `src/components/layout/`
  (nem em `components/layout/`, que hoje contém apenas `footer.tsx`,
  `header.tsx`, `mobile-nav.tsx`, `nav-links.ts`). Não há classes utilitárias
  de container/seção (`container-page`, `section-standard`, etc.) definidas
  em `app/globals.css`.
- `docs/design/spacing.md`, `docs/design/typography.md` e
  `docs/design/colors.md` já existem e são completos, mas descrevem
  **direção/intervalos de valores** (ex.: container 1280px–1440px, gutters
  responsivos, escala de spacing conceitual), não valores finais únicos —
  a escolha do valor exato dentro de cada intervalo é uma decisão de
  implementação/arquitetura ainda não tomada.

## Conflito de escopo identificado

As "Technical Notes"/"Como implementar" do Notion mencionam "estender theme
no `tailwind.config`". Isso conflita com o estado real do repositório: o
projeto está em **Tailwind v4 com configuração CSS-first** (sem arquivo
`tailwind.config`). A extensão de tokens deve ocorrer em `app/globals.css`
(via `@theme`/CSS custom properties), não em um `tailwind.config.ts` a ser
criado. Este spec documenta esse ajuste; nenhum arquivo `tailwind.config`
deve ser criado só para atender à redação literal do Notion — a fonte de
verdade é o código atual (regra "Sources of truth" do `CLAUDE.md`).

Isso é reportado ao usuário como ajuste de escopo técnico (não uma decisão
de produto), mas fica registrado aqui para transparência antes da
implementação.

## Decisão do usuário sobre o item opcional (fonte/cor) — resolvida em 2026-09-17

O usuário confirmou explicitamente, em 2026-09-17, que o item opcional
citado no Notion ("configurar fonte e cores base") **entra no escopo** da
CARSHOP-74. Portanto, esta tarefa inclui:

- substituir a fonte atual (`Geist`, via `next/font/google` em
  `app/layout.tsx`) pela combinação **Barlow Condensed** (títulos/display) +
  **Manrope** (corpo/interface), conforme `docs/design/typography.md`;
- substituir a paleta de cores default do shadcn (grayscale oklch) em
  `app/globals.css` pela paleta CarShop (near-black, charcoal, warm white,
  cognac leather, etc.) conforme `docs/design/colors.md`.

Esta decisão está registrada aqui como resolvida — não é mais um ponto em
aberto. Os valores finais de mapeamento de tokens (`@theme`) permanecem sob
responsabilidade do `architect`, dentro dos valores/intervalos já definidos
em `docs/design/colors.md` e `docs/design/typography.md`.

## Escopo

Objetivo: estabelecer uma base de tokens e utilitários de layout
reutilizável (container, spacing e tema — fonte e cor) para eliminar CSS
ad-hoc nas páginas Public UI e Admin UI, sem redesenhar a aplicação.

Escopo concreto:

1. **Tokens de container e spacing** em `app/globals.css` (`@theme`),
   cobrindo, no mínimo:
   - largura máxima de conteúdo (`container-page`, conforme
     `docs/design/spacing.md`, intervalo 1280px–1440px);
   - largura de container de leitura (`container-reading`, ~640px–760px),
     se aplicável ao escopo atual das páginas existentes;
   - gutters horizontais responsivos (mobile/tablet/desktop/large desktop);
   - escala de spacing (reaproveitando a escala conceitual de
     `docs/design/spacing.md`: 4/8/12/16/24/32/48/64/80/96/128/160px) —
     apenas os valores efetivamente necessários pelos componentes atuais,
     evitando tokens especulativos não usados.
2. **Componentes `Layout`/`Container`** reutilizáveis (ex.:
   `components/layout/container.tsx`, `components/layout/page-section.tsx`
   ou nomenclatura equivalente definida pelo `architect`), consumindo os
   tokens acima via classes Tailwind/utilitárias, para uso tanto em Public UI
   quanto Admin UI.
3. **Classes utilitárias de seção** (ex.: `section-compact`,
   `section-standard`, `section-editorial`) conforme os "Semantic Layout
   Tokens" sugeridos em `docs/design/spacing.md`, na medida do necessário
   para suportar as páginas já existentes (`app/(public)/page.tsx`,
   `about`, `services`, `contact`, `portfolio`).
4. **Paleta de cores CarShop** (near-black/charcoal/warm surface/warm
   white/secondary e muted foreground/border/cognac leather) aplicada em
   `app/globals.css`, substituindo os valores default do shadcn nos tokens
   semânticos já existentes (`--background`, `--foreground`, `--primary`,
   `--secondary`, `--muted`, `--muted-foreground`, `--border`, `--accent`,
   etc.), conforme o mapeamento sugerido em `docs/design/colors.md`. Cores
   semânticas (`--destructive`, sucesso, warning) devem ser validadas
   quanto a contraste/acessibilidade conforme o mesmo documento.
5. **Fonte base** trocada em `app/layout.tsx`: substituir `Geist`
   (`next/font/google`) por **Barlow Condensed** (uso em headings/display,
   conforme `docs/design/typography.md`) e **Manrope** (uso em corpo,
   navegação, botões, formulários, admin), carregadas via `next/font`,
   com apenas os pesos efetivamente usados (Barlow Condensed: 500/600/700;
   Manrope: 400/500/600/700), preservando fallback conforme o documento.

## Fora de escopo

- Redesenho de páginas/seções existentes (Hero, Services, Portfolio, etc.)
  além da troca de tokens de cor/fonte/spacing/container em si — layout de
  conteúdo e composição de cada seção não são alterados nesta tarefa.
- Qualquer componente de UI não relacionado a layout/container/spacing/tema
  (cards, botões, formulários) além dos ajustes de token necessários.
- Criação de `tailwind.config.ts` (não aplicável à arquitetura Tailwind v4
  CSS-first já convergida no repositório).

## Critérios de aceite (DoD ajustado)

- Existem tokens de spacing e de largura de container centralizados em
  `app/globals.css`, sem valores arbitrários (`mt-[73px]` etc.) espalhados
  pelos componentes de layout.
- Existem componentes `Layout`/`Container` reutilizáveis, testados
  (unit tests conforme stack de testes do projeto), usados por pelo menos
  uma página pública e disponíveis para uso no Admin UI.
- As páginas públicas existentes (`app/(public)/page.tsx`, `about`,
  `services`, `contact`, `portfolio`) usam o(s) novo(s) componente(s) de
  container/layout em vez de larguras/paddings ad-hoc, sem alterar o
  conteúdo ou comportamento dessas páginas.
- `app/globals.css` usa a paleta de cores CarShop (cognac/near-black/warm
  white, etc.) nos tokens semânticos consumidos pelos componentes, em vez
  dos valores default do shadcn.
- `app/layout.tsx` carrega Barlow Condensed e Manrope via `next/font`, e os
  componentes existentes aplicam essas fontes conforme os papéis definidos
  em `docs/design/typography.md` (Barlow Condensed para display/headings,
  Manrope para corpo/interface).
- Todas as combinações de cor foreground/background usadas pelos
  componentes afetados atendem contraste WCAG conforme
  `docs/design/colors.md`.
- `docs/rules/` (TypeScript estrito, rendering, testing) são respeitados.
- Nenhum segredo ou dado sensível é introduzido (não aplicável a esta
  tarefa, mas mantido por conformidade com `docs/rules/spec-security.md`).

## Classificação de tamanho

**NON-TRIVIAL** — a tarefa afeta múltiplas áreas do código (tokens em
`app/globals.css`, fonte em `app/layout.tsx`, novos componentes de layout
reutilizáveis, refatoração de páginas públicas existentes para consumi-los)
e envolve decisões arquiteturais/de UI que devem ser tomadas explicitamente
antes da implementação, entre elas:

- nomenclatura e API dos componentes `Layout`/`Container` (props, limites de
  responsabilidade, Server vs Client Component);
- escolha dos valores finais dentro dos intervalos definidos em
  `docs/design/spacing.md` (ex.: container em 1280px ou 1440px; gutters
  exatos por breakpoint);
- mapeamento final dos tokens de cor (`@theme`) e de fonte para os papéis
  semânticos definidos em `docs/design/colors.md`/`docs/design/typography.md`;
- estratégia de migração das páginas existentes sem quebrar o layout atual,
  dado que a troca de tema de cor e fonte é visível em toda a aplicação.

Um plano persistido (`plan-writer`) é obrigatório antes do `developer`
iniciar a implementação.

## Próximos agentes necessários

- `knowledge-reader`: recomendado. Pode haver notas no Obsidian sobre
  decisões anteriores de tema/tailwind v4 ou sobre a convergência para
  Next.js App Router que sejam relevantes para esta base de tokens.
- `architect`: obrigatório. Deve decidir a estrutura dos componentes
  `Layout`/`Container`, os valores finais de container/gutter/spacing
  dentro dos intervalos de `docs/design/spacing.md`, o mapeamento final de
  cor e fonte (`docs/design/colors.md`/`docs/design/typography.md`), e os
  limites de Server/Client Component.
- `plan-writer`: obrigatório (tarefa NON-TRIVIAL) — plano deve detalhar a
  ordem de criação dos tokens (spacing, container, cor, fonte), dos
  componentes e da migração das páginas existentes.
