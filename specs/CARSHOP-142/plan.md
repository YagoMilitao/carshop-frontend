# CARSHOP-142 — Plano de implementação

## Referência

Baseado em `specs/CARSHOP-142/spec.md` (NON-TRIVIAL) e na decisão
arquitetural do `architect` de 2026-09-18. Este plano reflete fielmente
essa decisão; não introduz novas decisões de arquitetura.

## Limites rígidos de escopo (não revisitar sem aprovação do usuário)

- **Fundação técnica de CARSHOP-74 é intocável como base**: paleta em
  `app/globals.css` e fontes (`next/font`) em `app/layout.tsx` **não são
  revertidas nem reescritas**, apenas estendidas (novos tokens,
  utilities).
- **`app/layout.tsx` não deve ser alterado.**
- **Public UI — sem invenção de conteúdo/seções novas**: nas páginas
  stub (`app/(public)/page.tsx`, `about/page.tsx`, `services/page.tsx`,
  `contact/page.tsx`) o trabalho é limitado a aplicar
  tokens/tipografia/primitives ao conteúdo placeholder já existente.
  **Não criar** Hero, Craftsmanship, Testimonials, Before/After, Trust
  Stats, Final CTA ou qualquer seção nova — isso é aspiracional em
  `docs/design/visual-direction.md`, mas não existe no código hoje e
  fica para task futura de produto/conteúdo.
- **Portfolio (lista `app/(public)/portfolio/page.tsx` e detalhe
  `portfolio/[slug]/page.tsx`)**: aqui sim há redesign de composição
  real, mas usando exclusivamente os dados reais já existentes
  (`getWorks`, `getWorkComments`) — sem inventar campos, imagens ou
  copy que não existam na fonte de dados atual.
- **Button (`components/ui/button.tsx`)**: manter as chaves de variante
  atuais (`default`, `outline`, `secondary`, `ghost`, `destructive`,
  `link`). **Não introduzir** `primary`/`text-action` como novas chaves
  (evita quebrar ADR-009 e call-sites existentes). Mapeamento
  conceitual: `default`=Primary, `outline`/`secondary`=Secondary,
  `link`/`ghost`=Text Action, `destructive`=ação destrutiva.
- **Radius único e compartilhado** entre Public e Admin — não criar
  radius paralelo por contexto.
- **Novos primitives (`card`, `input`, `label`, `badge`) somente via
  CLI shadcn** (`npx shadcn add card input label badge`), nunca
  escritos à mão do zero.
- **Sem `tailwind.config.ts`** — Tailwind v4 CSS-first já convergido.
- **Sem novo `"use client"`** em nenhum primitive redesenhado (Button,
  Card, Input, Label, Badge permanecem Server Components puros).
  `dialog.tsx` já é `"use client"` e continua assim.
- **Card/Badge**: uso esperado em Admin; evitar em Public (Portfolio
  deve permanecer composição editorial, não cards genéricos).
- **Tipografia display** (`text-display-*`, `text-heading-1/2` com
  Barlow Condensed): uso exclusivo de Public UI. Admin usa
  majoritariamente Manrope; Barlow Condensed no máximo em `h1` de
  página admin, nunca em escala display.
- **Motion**: Admin pode usar spinners/skeletons convencionais; Public
  restrito a hover sutil, sem loaders decorativos.
- **Alternativas já descartadas — não revisitar sem novo motivo
  documentado**:
  - Variantes de Button renomeadas para `primary`/`secondary`/`text-action`.
  - Radius separado para Admin vs Public.
  - Nova categoria `section-immersive` em `PageSection` (prematuro).

## Faseamento

O trabalho é sequencial e cada fase deve manter build/lint/typecheck/
testes verdes antes de avançar para a próxima, dado o risco de
regressão visual ampla por tocar tokens globais.

---

### Fase 1 — Tokens de cor + tipografia semântica + Button/Dialog

**Objetivo**: fundação de tokens estendida e primitives existentes
(Button, Dialog) já refletindo o novo radius/cores, sem novos
primitives ainda.

**Arquivos**:
- `app/globals.css`

**Passos**:
1. Em `:root` e `@theme inline` de `app/globals.css`, adicionar (usando
   sempre `--color-*`, nunca `--container-*`):
   - `--surface: #151515` (alias de `--card`)
   - `--surface-warm: #1c1b19` (alias de `--secondary`)
   - Corrigir `--secondary-foreground` para `#C8C3BA` (hoje igual a
     `--foreground`, incorreto)
   - `--border-strong: #47433D`
   - `--focus-ring` como alias de `--ring` (`#b56a3b`), expor como
     `--color-focus-ring`
   - `--success: #4E8B5C`
   - `--warning: #B8863B`
   - Substituir `--destructive` (hoje `oklch()` herdado do shadcn) por
     `#B23B3B`
   - Validar contraste ≥ 4.5:1 de `success`/`warning`/`destructive`
     contra os fundos onde serão de fato usados (texto sobre
     `background`/`card`/`surface`); ajustar apenas se o contraste
     falhar, sem alterar os valores já aprovados sem necessidade.
2. Reduzir `--radius` da base de `0.625rem` (10px) para um valor único
   na faixa 4–8px recomendada por `docs/design/components.md`.
3. Adicionar a escala tipográfica semântica via `@utility` (CSS puro,
   sem `"use client"`): `text-display-xl`, `text-display-lg`,
   `text-heading-1`, `text-heading-2`, `text-heading-3`,
   `text-heading-4`, `text-body-lg`, `text-body`, `text-body-sm`,
   `text-label`, `text-nav`, `text-button`. Font-family: heading →
   Barlow Condensed, demais → Manrope (com variante editorial explícita
   usando `font-heading` apenas quando indicado em contexto Public,
   conforme `docs/design/typography.md`). `font-size` via `clamp()`,
   `line-height` e `letter-spacing` conforme o mesmo documento.
4. Em `components/ui/button.tsx`: nenhuma nova variante; apenas
   garantir que os `cva` de radius/tipografia consumam os tokens
   atualizados (radius reduzido, `text-button` se aplicável) sem mudar
   as chaves `default/outline/secondary/ghost/destructive/link`.
5. Em `components/ui/dialog.tsx`: ajuste pontual de `rounded-xl` para o
   novo radius reduzido; manter sombra atual; sem mudança de client
   boundary.

**Arquivos tocados**: `app/globals.css`, `components/ui/button.tsx`,
`components/ui/dialog.tsx`.

**Critérios de aceite da Fase 1**:
- Nenhum valor `oklch()` remanescente para `--destructive`.
- Tokens `surface`, `surface-warm`, `border-strong`, `focus-ring`,
  `success`, `warning` existem e resolvem para os hex especificados.
- `secondary-foreground` não é mais igual a `foreground`.
- Utilities tipográficas semânticas compilam e são aplicáveis via
  classe (`text-heading-1`, etc.).
- Testes existentes de `button.tsx` continuam passando (ajustar apenas
  asserts de classe que dependiam do radius antigo, se houver, sem
  alterar comportamento).
- Lint, typecheck e build passam.

---

### Fase 2 — Novos primitives via CLI (card, input, label, badge)

**Objetivo**: disponibilizar os primitives que faltam para uso em
Admin (e, com moderação, Public), restilizados ao radius/tokens da
Fase 1.

**Passos**:
1. Rodar `npx shadcn add card input label badge` para gerar os
   arquivos oficiais — nunca escrever manualmente.
2. Ajustar cada primitive gerado apenas no necessário para consumir os
   tokens de radius/cor/tipografia já definidos (ex.: `border-strong`
   em vez de `border` quando aplicável a cards, `text-label` em
   `label.tsx`), preservando a estrutura padrão do shadcn.
3. Confirmar que nenhum dos primitives novos recebe `"use client"`
   (Server Components puros).

**Arquivos**: `components/ui/card.tsx`, `components/ui/input.tsx`,
`components/ui/label.tsx`, `components/ui/badge.tsx` (novos).

**Critérios de aceite da Fase 2**:
- Os 4 primitives existem, seguem o padrão CLI do shadcn e usam os
  tokens de radius/cor da Fase 1 (sem hex arbitrário).
- Nenhum ganhou `"use client"` novo.
- Lint, typecheck e build passam.

---

### Fase 3 — Composição de páginas Admin

**Objetivo**: Admin passa a consumir `Container`/`PageSection`/novos
primitives/tokens tipográficos em vez de classes ad-hoc, sem alterar
boundaries Server/Client existentes.

**Arquivos**:
- `app/(admin)/admin/(protected)/page.tsx`
- `app/(admin)/admin/(protected)/create-work-form.tsx`
- `app/(admin)/admin/(protected)/comment-moderation-form.tsx`
- `app/(admin)/admin/(protected)/work-list-item.tsx` (caminho exato
  conforme estrutura real do repositório)
- `app/(admin)/admin/login/page.tsx`

**Passos**:
1. Introduzir `PageSection` com `spacing="compact"` como padrão nas
   páginas admin (hoje nenhuma usa `PageSection`) e `Container` onde
   fizer sentido para largura de conteúdo.
2. Substituir `<input>` cru por `Input`/`Label` (Fase 2) nos
   formulários (`create-work-form.tsx`, `comment-moderation-form.tsx`,
   login).
3. Onde fizer sentido para agrupar informação (ex. item de work na
   listagem), usar `Card`/`Badge` (uso esperado em Admin).
4. Substituir tamanhos ad-hoc (`text-2xl font-semibold`,
   `text-lg font-medium`, etc.) pela escala tipográfica semântica,
   restrita a Manrope — Barlow Condensed no máximo em um `h1` de página
   admin, nunca em escala display.
5. Preservar exatamente os boundaries Server/Client já existentes
   (nenhuma página ou componente muda de Server para Client ou
   vice-versa nesta fase).
6. Validar manualmente que os fluxos de login, criação de work e
   moderação de comentários continuam funcionando (sem regressão
   funcional).

**Critérios de aceite da Fase 3**:
- Nenhuma classe Tailwind arbitrária de spacing tipo `mt-[73px]`
  remanescente nos arquivos tocados.
- Formulários admin usam `Input`/`Label` em vez de `<input>` cru.
- Boundaries Server/Client inalterados.
- Testes existentes relevantes (formulários, moderação, login)
  continuam passando.
- Lint, typecheck e build passam.

---

### Fase 4 — Composição de páginas Public (stubs + Portfolio)

**Objetivo**: aplicar tokens/tipografia/primitives aos stubs
existentes e redesenhar a composição real do Portfolio com dados
reais, respeitando os limites rígidos de escopo acima.

**Arquivos**:
- `app/(public)/page.tsx`
- `app/(public)/about/page.tsx`
- `app/(public)/services/page.tsx`
- `app/(public)/contact/page.tsx`
- `app/(public)/portfolio/page.tsx`
- `app/(public)/portfolio/[slug]/page.tsx`
- `comment-form.tsx` (componente de comentário usado no detalhe do
  portfolio)
- `components/layout/header.tsx`, `components/layout/footer.tsx`
  (migração de tamanhos ad-hoc para escala tipográfica semântica)

**Passos**:
1. Nos 4 stubs (Home/About/Services/Contact): aplicar
   `text-display-*`/`text-heading-*`/`text-body-*` ao `h1`/`p`
   existentes dentro de `PageSection`, sem adicionar novo conteúdo ou
   novas seções.
2. Em `header.tsx`/`footer.tsx`: substituir `text-lg`/`text-sm` ad-hoc
   por `text-nav`/`text-label`/`text-body-sm` conforme semântica do
   elemento, sem alterar estrutura/Server-Client boundary.
3. Em `portfolio/page.tsx`: redesenhar a listagem de `getWorks` como
   composição editorial (sem `Card`/`Badge` genéricos), usando
   `Container`/`PageSection` com variante `editorial`/`reading`
   conforme já mapeado, tipografia display/heading da escala semântica,
   substituindo `ul/li` cru e `font-medium` ad-hoc.
4. Em `portfolio/[slug]/page.tsx` e `comment-form.tsx`: redesenhar a
   composição de detalhe (dados de `getWorkComments`) com a mesma
   lógica editorial, mantendo motion restrito a hover sutil (sem
   loaders decorativos).
5. Validar manualmente que a navegação entre listagem e detalhe e o
   fluxo de comentários continuam funcionando.

**Critérios de aceite da Fase 4**:
- Stubs mantêm exatamente o mesmo conteúdo textual, apenas com tokens
  tipográficos aplicados — nenhuma seção nova foi criada.
- Portfolio (lista e detalhe) usa apenas dados reais já existentes,
  sem `Card`/`Badge`, com tipografia display/heading Public.
- `header.tsx`/`footer.tsx` sem `text-lg`/`text-sm` ad-hoc remanescente
  onde a escala semântica se aplica.
- Testes existentes de `header.tsx`, `footer.tsx`, `mobile-nav.tsx`
  continuam passando.
- Lint, typecheck e build passam.

---

## Ordem de execução

Fase 1 → Fase 2 → Fase 3 → Fase 4, estritamente sequencial. Cada fase
deve ser validada (lint, typecheck, build, testes) antes de iniciar a
próxima, dado o risco de regressão visual ampla identificado na spec.
Se o volume tornar o PR muito grande, considerar dividir em PRs por
fase, mantendo a ordem acima.

## Critérios de aceite gerais (DoD, validação final após Fase 4)

- Tokens semânticos de cor cobrem Near Black, Charcoal, Warm Surface,
  Warm White, Cognac e estados funcionais (success/warning/destructive)
  sem hex arbitrário espalhado em componentes, com contraste WCAG
  validado.
- Barlow Condensed/Manrope via `next/font` sem regressão.
- Escala tipográfica semântica implementada e consumida por Public e
  Admin conforme a divergência descrita (display exclusivo Public).
- Containers, spacing de seção, botões e primitives comuns seguem o
  sistema de tokens, sem valores arbitrários (`mt-[73px]` etc.).
- Primitives (Button, Dialog, Card, Input, Label, Badge) refletem
  `docs/design/components.md` de forma sistemática nas telas onde
  aparecem.
- Composição visual de páginas Public/Admin reflete os primitives
  redesenhados respeitando a divergência editorial (Public) vs
  usabilidade (Admin).
- Shadcn/UI permanece fundação técnica; nenhum primitive tem aparência
  genérica de SaaS (radius, hierarquia, ausência de glow/gradiente).
- Fundação de CARSHOP-74 (`app/globals.css` base, `next/font` em
  `app/layout.tsx`) não é revertida nem reescrita, apenas estendida.
- Sem regressão funcional em navegação, formulários, moderação de
  comentários e criação de work.
- Responsividade, acessibilidade (contraste, foco visível, HTML
  semântico), lint, typecheck, build e testes (incluindo os já
  existentes de `container.tsx`, `page-section.tsx`, `button.tsx`,
  `header.tsx`, `footer.tsx`, `mobile-nav.tsx`, mais os de qualquer
  primitive/página tocados) passam, com cobertura ≥ 80% no código
  novo/alterado quando aplicável.

## Riscos a monitorar durante a implementação

- Mudança de `--radius` e `--secondary-foreground`/`--destructive`
  afeta Button/Dialog e os novos Input/Card globalmente — risco de
  regressão visual ampla e de quebrar testes que fazem assert de
  classes CSS específicas em vez de comportamento/acessibilidade.
  Preferir ajustar asserts de teste para comportamento/acessibilidade
  quando eles dependerem de classes que mudaram por causa do token, em
  vez de manter valores antigos artificialmente.
- Superfície grande de PR pelos 4 novos primitives + redesign de
  páginas — considerar PRs incrementais por fase (ver "Ordem de
  execução").
