# CARSHOP-142 — Refatorar fundação visual do frontend com o novo design system

## Referência

Tarefa original no Notion: CARSHOP-142 ("Refatorar fundação visual do
frontend com o novo design system"). Ver Descrição, DoD e Technical Notes
completos na tarefa.

Status: To Do · Priority: High · Sprint 5 · Component: Public UI, Admin UI ·
Epic: UI & Styling · Points: 3.

## Estado atual do repositório (investigação)

- **Cores**: `app/globals.css` já usa a paleta CarShop aprovada em
  `docs/design/colors.md` (Near Black `#0c0c0c`, Warm White `#f4f0e8`,
  Cognac `#b56a3b`, Charcoal `#151515`, Warm Surface `#1c1b19` como
  `--secondary`, Border `#302e2a`). Faltam, porém, tokens semânticos
  explícitos sugeridos pelo documento e ainda não mapeados 1:1: `surface`
  vs `surface-warm` (hoje ambos colapsam em `--secondary`/`--muted`),
  `border-strong` (`#47433D`), `success`/`warning` dedicados (hoje só há
  `--destructive`, em `oklch`, não a paleta CarShop), e `secondary-foreground`
  usa o mesmo valor de `foreground` em vez do "Secondary Foreground"
  (`#C8C3BA`) descrito no documento.
- **Tipografia**: `app/layout.tsx` já carrega Barlow Condensed
  (`--font-heading`, pesos 500/600/700) e Manrope (`--font-sans`, pesos
  400/500/600/700) via `next/font/google`, aplicados globalmente
  (`font-sans` no `<html>`, `font-heading` em `h1–h6` via `@layer base`).
  Isso já atende ao item do DoD sobre fontes. **Não existe**, porém, a
  escala tipográfica semântica sugerida em `docs/design/typography.md`
  (`display-xl`, `display-lg`, `heading-1..4`, `body-lg`, `body`, `body-sm`,
  `label`, `navigation`, `button`) — os componentes hoje usam tamanhos
  Tailwind arbitrários por componente (`text-2xl font-semibold`,
  `text-lg font-medium`, etc., ex. em `app/(admin)/admin/(protected)/page.tsx`).
- **Spacing/Containers**: já existem `components/layout/container.tsx` e
  `components/layout/page-section.tsx`, além das utilities `container-page`
  e `container-reading` em `app/globals.css`. O alcance dessas utilities e
  se cobrem as categorias `section-compact/standard/editorial/immersive`
  descritas em `docs/design/spacing.md` precisa ser confirmado por leitura
  desses arquivos pelo `architect` — não foi possível confirmar cobertura
  completa nesta leitura de spec.
- **Botões/primitives**: `components/ui/button.tsx` é o botão padrão do
  shadcn/UI com variantes genéricas (`default`, `outline`, `secondary`,
  `ghost`, `destructive`, `link`) e tamanhos (`xs`–`lg`, ícones). Não reflete
  ainda a hierarquia específica de `docs/design/components.md` (Primary /
  Secondary / Text Action, radius restrito 4–8px, tipografia Manrope
  600–700, sem pill/gradiente/glow). É usado tanto em Public UI quanto
  (presumivelmente) Admin UI — precisa de decisão do `architect` sobre se
  o mesmo componente serve aos dois contextos com variantes diferentes ou
  se há distinção estrutural.
- **Admin UI**: a página `app/(admin)/admin/(protected)/page.tsx` usa
  classes utilitárias ad-hoc (`max-w-3xl`, `text-2xl font-semibold`,
  `text-lg font-medium`) em vez dos primitives de layout/tipografia
  existentes (`Container`, `PageSection`) ou de tokens semânticos —
  candidata direta ao trabalho desta task.
- Não existe `tailwind.config.ts` (Tailwind v4 CSS-first, config vive em
  `app/globals.css` via `@theme`), consistente com a decisão já registrada
  em `specs/CARSHOP-74/spec.md`.

## Conflito de escopo identificado — decisão do usuário registrada

CARSHOP-74 (Done, não deve ser reaberta) já entregou uma parcela
significativa do que a Descrição/DoD de CARSHOP-142 pedem: paleta de cores
CarShop aplicada em `app/globals.css`, fontes Barlow Condensed/Manrope via
`next/font`, e componentes `Container`/`PageSection` com tokens de
container/spacing. A Description de CARSHOP-142 fala em "substituir a
fundação visual antiga" — mas a fundação **atual** já não é a antiga
(default shadcn/Geist) que CARSHOP-74 substituiu; é, em boa parte, a própria
fundação CarShop.

Isso gerou uma ambiguidade de escopo real entre:

1. **consolidar/completar** a fundação já iniciada por CARSHOP-74 (tokens
   semânticos faltantes, escala tipográfica, categorias de section spacing,
   primitives de botão/UI conforme `components.md`) sem tocar no que já
   está correto, ou
2. um **redesign mais amplo** dos primitives e de como Public UI e Admin UI
   consomem esses tokens (incluindo refatorar páginas existentes para
   usar `Container`/`PageSection`/escala tipográfica em vez de classes
   ad-hoc, e revisar composição visual dos primitives em si).

**Decisão do usuário (2026-09-18):** o usuário optou explicitamente pela
opção **2 — redesign mais amplo**. CARSHOP-142 deve ser tratada como uma
revisão visual mais profunda dos primitives (botões, cards, superfícies,
containers) e da composição de páginas em Public UI e Admin UI, e não
apenas como uma consolidação pontual de tokens/tipografia faltantes.

Essa decisão é sobre **profundidade do redesign** dos componentes e páginas
construídos sobre a fundação CarShop — ela **não** reabre nem duplica o
trabalho já entregue por CARSHOP-74. Seguem valendo, sem alteração:

- `app/globals.css` (paleta de cores base, `@theme` CSS-first) e o setup de
  fontes via `next/font` em `app/layout.tsx` entregues por CARSHOP-74
  permanecem como fundação técnica — não devem ser revertidos ou
  re-arquitetados; podem ser **estendidos** (novos tokens semânticos,
  escala tipográfica) mas não desfeitos.
- `docs/design/*` continua sendo a fonte visual autoritativa na ausência de
  Figma aprovado.
- Não há necessidade identificada de criar `tailwind.config.ts` (Tailwind
  v4 CSS-first já convergido).

O `architect` deve traduzir essa decisão em limites estruturais concretos
(quais primitives são redesenhados, até que ponto a composição de páginas é
alterada) antes da implementação.

## Escopo

Objetivo: realizar um redesign mais amplo dos primitives visuais (botões,
cards, superfícies, containers) e da composição visual das páginas de
Public UI e Admin UI, construído sobre a fundação técnica já entregue por
CARSHOP-74 (cores base, fontes via `next/font`), cobrindo tanto as lacunas
de tokens/tipografia identificadas acima quanto uma revisão mais profunda de
como esses primitives se apresentam e são compostos nas páginas — sem
reabrir ou desfazer o trabalho de CARSHOP-74.

Escopo concreto (sujeito a refinamento pelo `architect`):

1. **Tokens semânticos de cor**: completar/ajustar `app/globals.css` para
   incluir os tokens ainda faltantes ou incorretos frente a
   `docs/design/colors.md` (`surface` vs `surface-warm`,
   `secondary-foreground` correto, `border-strong`, `success`, `warning`,
   `focus-ring`), validando contraste WCAG.
2. **Escala tipográfica semântica**: introduzir tokens/utilities
   (`display-xl`, `display-lg`, `heading-1..4`, `body-lg`, `body`,
   `body-sm`, `label`, `navigation`, `button`) conforme
   `docs/design/typography.md`, e migrar os componentes existentes que hoje
   usam tamanhos ad-hoc para consumi-los.
3. **Spacing/containers**: confirmar e completar as categorias de seção
   (`section-compact/standard/editorial/immersive`) e gutters responsivos
   em `app/globals.css`/`page-section.tsx`, conforme
   `docs/design/spacing.md`.
4. **Redesign de primitives**: revisar e redesenhar `components/ui/button.tsx`,
   cards, superfícies e outros primitives existentes (ex. `dialog.tsx`)
   frente a `docs/design/components.md` (hierarquia Primary/Secondary/Text
   Action, radius restrito, ausência de pill/gradiente/glow), com escopo
   mais amplo que um ajuste pontual de variantes — incluindo, quando
   justificado pelo `architect`, novas variantes/estrutura visual dos
   primitives — preservando Shadcn/UI como fundação técnica sem aparência
   genérica de SaaS.
5. **Redesign da composição visual de páginas em Public UI e Admin UI**:
   revisar não apenas a substituição de classes ad-hoc pelos
   tokens/primitives acima, mas a composição visual das páginas existentes
   (`app/(public)/*`, `app/(admin)/admin/*`) — hierarquia visual, uso de
   superfícies/containers, disposição dos primitives redesenhados —
   respeitando a distinção de prioridades entre Public UI
   (editorial/craftsmanship) e Admin UI (usabilidade/eficiência) definida
   em `visual-direction.md`.

## Fora de escopo

- Reabrir, alterar ou reverter a fundação técnica já implementada por
  CARSHOP-74 (paleta base em `app/globals.css`, setup de fontes via
  `next/font` em `app/layout.tsx`) sem justificativa documentada de
  bug/inconsistência real. Extensões (novos tokens, novas utilities) são
  permitidas; reescrita/reversão da fundação não é.
- Redesenho de conteúdo/copy e de novas seções de página fora do que já
  existe (ex. criar seções inteiramente novas tipo depoimentos, blog) —
  o redesign amplo cobre primitives e composição visual das páginas
  **existentes**, não a criação de novo conteúdo/estrutura de informação.
- Criação de `tailwind.config.ts` (arquitetura CSS-first já convergida),
  a menos que o `architect` identifique uma necessidade técnica concreta e
  documente a justificativa.
- Novos endpoints ou mudanças de contrato de API.
- Migração de bibliotecas fora do stack já aprovado (Tailwind, Shadcn/UI,
  Framer Motion, React Icons, etc.).

## Critérios de aceite (derivados do DoD)

- Tokens semânticos de cor em `app/globals.css` cobrem Near Black,
  Charcoal, Warm Surface, Warm White, Cognac e estados funcionais
  (success/warning/destructive) sem hex arbitrário espalhado em
  componentes, com contraste WCAG validado.
- Barlow Condensed permanece aplicada ao display/headings e Manrope ao
  corpo/UI via `next/font` (já satisfeito; não deve haver regressão).
- Existe uma escala tipográfica semântica documentada/implementada e os
  componentes relevantes de Public UI e Admin UI a utilizam em vez de
  tamanhos Tailwind arbitrários repetidos.
- Containers, spacing de seção, botões e primitives comuns seguem o
  sistema de tokens (sem valores arbitrários tipo `mt-[73px]`) tanto em
  Public UI quanto em Admin UI.
- Os primitives visuais (botões, cards, superfícies, containers) refletem
  a hierarquia e a linguagem visual de `docs/design/components.md` de forma
  consistente em todas as telas onde aparecem, não apenas nos pontos
  pontuais identificados na investigação inicial — o redesign é aplicado de
  forma sistemática, não isolada.
- A composição visual das páginas existentes de Public UI e Admin UI reflete
  os primitives redesenhados e a fundação de tokens, respeitando a
  divergência de prioridades Public UI (editorial/craftsmanship) vs Admin UI
  (usabilidade/eficiência) definida em `visual-direction.md`.
- Shadcn/UI permanece como fundação técnica, mas os primitives visíveis
  (botões, inputs, dialogs, cards) não têm aparência genérica de SaaS
  (radius, hierarquia de ação, ausência de glow/gradiente conforme
  `docs/design/components.md`).
- A fundação técnica entregue por CARSHOP-74 (`app/globals.css` base,
  `next/font` em `app/layout.tsx`) não é revertida nem reescrita — apenas
  estendida.
- Não há regressão funcional nas páginas públicas e administrativas
  existentes (fluxos de navegação, formulários, moderação de comentários,
  criação de work continuam funcionando).
- Responsividade, acessibilidade (contraste, foco visível, HTML semântico),
  lint, typecheck, build e testes relevantes (incluindo os testes já
  existentes de `container.tsx`, `page-section.tsx`, `button.tsx`,
  `header.tsx`, `footer.tsx`, `mobile-nav.tsx`, além dos testes de qualquer
  primitive redesenhado ou página recomposta) continuam passando, com
  cobertura ≥ 80% no código novo/alterado quando aplicável.

## Riscos e dependências

- **Risco de sobreposição com CARSHOP-74**: mesmo com a decisão do usuário
  de redesign mais amplo, o `developer` deve tratar `app/globals.css`
  (paleta base) e o setup de fontes em `app/layout.tsx` como fundação
  técnica intocável — o `architect` deve deixar explícito nos limites do
  plano o que é extensão versus o que seria reabertura indevida de
  CARSHOP-74.
- **Risco de regressão visual ampla**: por tocar tokens de cor/tipografia
  consumidos globalmente (`@theme`, `@layer base`) e redesenhar primitives
  usados em múltiplas páginas, o escopo mais amplo aumenta a superfície de
  mudança simultânea em Public UI e Admin UI — exige validação cuidadosa
  (visual e de testes) antes do review, possivelmente em etapas
  incrementais definidas pelo `plan-writer`.
- **Risco de escopo crescer além do sustentável em um único ciclo**: um
  redesign amplo de primitives + composição de páginas em dois contextos
  (Public UI e Admin UI) é significativamente maior que uma consolidação de
  tokens; o `plan-writer` deve considerar sequenciamento/faseamento explícito
  para manter o ciclo revisável.
- **Dependência de decisão de arquitetura**: mapeamento final dos tokens
  semânticos faltantes, nomes/estrutura da escala tipográfica, extensão
  exata do redesign de cada primitive, e critério de quando Admin UI
  diverge de Public UI (conforme `visual-direction.md`, seção "Admin
  Experience") precisam ser decididos pelo `architect` antes da
  implementação.
- **Dependência de Figma**: não há menção a Figma aprovado nesta task; os
  documentos `docs/design/` são a fonte visual autoritativa na ausência
  dele, conforme hierarquia de fontes do `CLAUDE.md`.

## Classificação de tamanho

**NON-TRIVIAL** — com a decisão do usuário por um redesign mais amplo, a
tarefa toca múltiplas áreas do código (`app/globals.css`, `components/ui/*`,
`components/layout/*`, páginas de Public UI e Admin UI), exige decisões
arquiteturais explícitas (mapeamento final de tokens de cor/tipografia
faltantes, estrutura da escala tipográfica semântica, extensão do redesign
de cada primitive, critério de divergência Public vs Admin) e tem risco
ampliado de regressão visual por alterar tokens globais e primitives
amplamente reutilizados. Um plano persistido via `plan-writer` é
obrigatório antes do `developer` iniciar a implementação, com atenção a
possível faseamento dado o escopo maior.

## Próximos agentes necessários

- `knowledge-reader`: recomendado — pode haver notas no Obsidian sobre a
  implementação de CARSHOP-74 (decisões de tokens, Tailwind v4 CSS-first)
  relevantes para não duplicar trabalho.
- `architect`: obrigatório — deve traduzir a decisão do usuário (redesign
  mais amplo) em limites estruturais concretos: mapeamento final dos tokens
  semânticos faltantes, estrutura da escala tipográfica, extensão exata do
  redesign de cada primitive (botões, cards, superfícies, containers), os
  limites de Server/Client Component quando aplicável, e o critério de
  divergência visual Public UI vs Admin UI — sempre preservando a fundação
  técnica de CARSHOP-74.
- `plan-writer`: obrigatório (tarefa NON-TRIVIAL) — plano deve detalhar
  ordem de mudança de tokens, primitives redesenhados e páginas
  recompostas, com atenção especial a não regressão visual e a possível
  faseamento do trabalho dado o escopo ampliado.
