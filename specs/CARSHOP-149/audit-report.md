# Audit Report — CARSHOP-149

Auditoria visual, responsiva e de acessibilidade pós-redesign
(CARSHOP-142..148). Relatório produzido pelo `developer` após a correção de
A-01..A-10, seguindo `specs/CARSHOP-149/plan.md`.

## 1. Contexto

| Item | Valor |
| --- | --- |
| Branch | `fix/CARSHOP-149-post-redesign-ui-audit` (sem commit) |
| Base | `master` `84b8ca0` |
| Figma | Nenhum aprovado — fonte visual: `docs/design/*`, `docs/rules/accessibility.md`, `docs/rules/responsive.md` |
| Auditoria inicial | `architect` (estática, read-only), triada pelo usuário |
| Ferramentas automáticas | Sem axe/Lighthouse (fora de `package.json`, não adicionados) |
| Runtime usado | `next build` + `next start -p 3149` (produção), `curl` |
| Navegador | Não disponível nesta execução — checks que dependem de navegador estão marcados "Não verificado" |

## 2. Achados

Legenda de status: **Corrigido** (nesta task) · **Registrado → FU-N**
(follow-up proposto, pendente de validação do usuário) · **Conhecido**
(débito já registrado antes).

| ID | Sev. | Rota / breakpoint | Arquivo:linha (atual) | Regra violada | Correção / ação | Status |
| --- | --- | --- | --- | --- | --- | --- |
| A-01 | HIGH | Todas públicas + admin (primitives), todos | `components/layout/header.tsx:13,25`, `mobile-nav.tsx:42`, `footer.tsx:36,54`, `app/(public)/_components/home-hero.tsx:58`, `featured-works.tsx:37`, `project-preview.tsx:65`, `portfolio/_components/portfolio-text-entry.tsx:15`, `portfolio-state-message.tsx:45`, `portfolio/[slug]/_components/back-to-portfolio-link.tsx:9`, `project-gallery.tsx:93`, `portfolio/[slug]/comment-form.tsx:124`, `services/_components/service-category-row.tsx:19`, `about/page.tsx:27`, `contact/_components/contact-follow-links.tsx:27`, `components/gallery/gallery-lightbox.tsx:101,133,141`, `components/ui/input.tsx:10`, `textarea.tsx:9`, `native-select.tsx:26`, `badge.tsx:7`, `app/globals.css` (base `*`) | WCAG 2.4.7 / 1.4.11; `colors.md` "Focus Ring" — `ring-ring/50` = 2.01:1 | `focus-visible:ring-ring/50` → `focus-visible:ring-focus-ring`; `outline-none` → `outline-hidden` nos mesmos elementos; base `outline-ring/50` → `outline-focus-ring`; overrides de foco do `destructive` do `Badge` removidos (S2) | Corrigido |
| A-02 | HIGH | Todas com `Button` | `components/ui/button.tsx:7,20` | WCAG 2.4.7 / 1.4.11 — anel invisível no `default`, `ring-destructive/20` ~1.15:1 | Base: `ring-focus-ring ring-offset-2 ring-offset-background` + `outline-hidden`; overrides de foco do `destructive` removidos. `outline` (`border-muted-foreground/60`) e press `active:scale-[0.97]` + `motion-reduce` preservados | Corrigido |
| A-03 | HIGH | Formulários (login, works, comentários, comment-form) | `components/ui/input.tsx:10`, `textarea.tsx:9`, `native-select.tsx:26` | WCAG 2.4.7 — `aria-invalid:ring-*` vencia `focus-visible:ring-*` | Removidos `aria-invalid:ring-3 aria-invalid:ring-destructive/20` e `dark:aria-invalid:ring-destructive/40`; mantido `aria-invalid:border-destructive` (3.34:1) | Corrigido (estático; confirmação por estilo computado não verificada — ver check 2) |
| A-04 | HIGH | Formulários | `app/globals.css` (`--input`) | WCAG 1.4.11 — `#302e2a` 1.44:1 | `--input: color-mix(in srgb, var(--muted-foreground) 60%, transparent)` com comentário de contraste; `--border` inalterado (C-1) | Corrigido |
| A-05 | HIGH | Dialogs, alert-dialogs, sheet admin; lightbox público | `components/ui/dialog.tsx:42`, `alert-dialog.tsx:43`, `sheet.tsx:40`, `components/gallery/gallery-lightbox.tsx:78` | `visual-direction.md` "Anti-SaaS Rule" (glassmorphism) | Removido `supports-backdrop-filter:backdrop-blur-xs`; `bg-black/10` → `bg-background/80`; conteúdo do lightbox `bg-background/95` → `bg-background` | Corrigido |
| A-06 | HIGH | Qualquer rota inexistente, todos | `app/not-found.tsx` | Idioma (WCAG 3.1.1, `lang="en-US"`), design system, beco sem saída | Reescrito: `<main>` + `Container variant="page"`, `h1 text-heading-1`, apoio `text-body text-secondary-foreground`, link "Back to home" inline com `ring-focus-ring`, `metadata.title = "Page not found"`, copy em inglês | Corrigido |
| A-07 | HIGH | Erro de render global, todos | `app/error.tsx` | Idem A-06 + `<button>` cru | Reescrito no mesmo padrão; `Button` "Try again" → `reset()`; link "Back to home"; `console.error(error)` em `useEffect` | Corrigido |
| A-08 | MEDIUM | Admin (comentários, works) | `components/ui/native-select.tsx:26` | Consistência de controles (`components.md` Forms) | `h-8` → `h-9`; `text-sm` → `text-body-sm`; `data-[size=sm]` mantido | Corrigido |
| A-09 | MEDIUM | Dialogs/alert-dialogs/sheet | `alert-dialog.tsx:43,61`, `sheet.tsx:40,65`, `dialog.tsx:64` | `prefers-reduced-motion` (`docs/rules/accessibility.md`) | `motion-reduce:data-open:animate-none motion-reduce:data-closed:animate-none` adicionados | Corrigido |
| A-10 | MEDIUM | `/portfolio/[slug]` lightbox | `components/gallery/gallery-lightbox.tsx:101,133,141` | `components.md` (radius, shadows), foco sobre foto | `rounded-full` → `rounded-lg`; `shadow-md` removido; `bg-background/80` mantido; setas com `ring-focus-ring ring-offset-2 ring-offset-background`. `size-11`, `showCloseButton={false}`, reduced motion em 2 camadas e retorno de foco preservados | Corrigido |
| A-11 | MEDIUM | Admin | `dialog.tsx:133`, `alert-dialog.tsx:107`, `sheet.tsx:117` | `typography.md` "Admin Typography" | Proposta: `font-sans text-body font-semibold` | Registrado → FU-4 |
| A-12 | MEDIUM | `/portfolio/[slug]` | `comment-form.tsx:120-126` | Reuso de primitives | Migrar `<textarea>` cru para `Textarea` | Registrado → FU-4 |
| A-13 | MEDIUM | Header público | `header.tsx:34-41`, `mobile-nav.tsx:52-60`, `button.tsx:7` | `colors.md` "Disabled State" (~2.0:1) | Tratamento visual do "Get a Quote" desabilitado | Registrado → FU-5 |
| A-14 | MEDIUM | Header/footer públicos | `header.tsx:19`, `mobile-nav.tsx:22,35`, `footer.tsx:30,46` | WCAG 3.1.2 (labels pt-BR em página en-US) | Traduzir `aria-label`s | Registrado → FU-2 |
| A-15 | MEDIUM | Global | `app/layout.tsx:48` | Tokens de cor (`colors.md`) | Toaster nos tokens escuros | Registrado → FU-3 |
| A-16 | MEDIUM | Público md+ | `header.tsx:25`, `footer.tsx:36,54` | Touch targets ≥ 44px | Aumentar área clicável | Registrado → FU-1 |
| A-17 | MEDIUM | Admin | `button.tsx` `sm`, `admin-mobile-nav.tsx:47`, `sheet.tsx:76` | Touch targets | Revisar tamanhos | Registrado → FU-1 |
| A-18 | MEDIUM | Mobile iOS | `input.tsx:10`, textarea do `comment-form` | Zoom automático < 16px | Fonte ≥ 16px no mobile | Registrado → FU-4 |
| A-19 | MEDIUM | Admin | (ausente) `app/(admin)/admin/(protected)/error.tsx` | Idioma admin pt-BR | Boundary pt-BR com `AdminErrorState` | Registrado → FU-2 |
| A-20 | LOW | Loading states | `components/ui/skeleton.tsx:7` | Reduced motion | `motion-reduce:animate-none` | Registrado → FU-4 |
| A-21 | LOW | Vários | `mobile-nav.tsx:42`, `gallery-lightbox.tsx:151`, `dialog.tsx:149`, `alert-dialog.tsx:123`, `sheet.tsx:132`, `card.tsx:14`, `textarea.tsx:9` | Escala tipográfica semântica | Trocar tamanhos crus | Registrado → FU-4 |
| A-22 | LOW | Menu mobile público | `mobile-nav.tsx:31` | Shadows (`components.md`) | Remover `shadow-md` | Registrado → FU-5 |
| A-23 | LOW | Footer | `footer.tsx:50-57` | WCAG 3.2.5 (aviso de nova aba) | "(opens in a new tab)" | Registrado → FU-5 |
| A-24 | LOW | Nav pública | `header.tsx:23`, `mobile-nav.tsx:39` | `aria-current` | Adicionar | Registrado → FU-5 |
| A-25 | LOW | Admin | `sheet.tsx:80`, `dialog.tsx:79` | Idioma | "Fechar" | Registrado → FU-2 |
| A-26 | LOW | Menu mobile público | `mobile-nav.tsx` | Teclado (Esc) | Fechar com Esc | Registrado → FU-5 |
| A-27 | LOW | Global | — | WCAG 2.4.1 (melhoria) | Skip link | Registrado → FU-5 |

## 3. Contraste

Luminância relativa WCAG, recalculada onde houve mudança de token. Valores
de `--input` são do composto de `#aaa59c` a 60% sobre o fundo.

| Par | Contraste | Status |
| --- | --- | --- |
| foreground / bg | 17.21 | OK |
| muted-fg / bg | 7.98 | OK |
| muted-fg / surface-warm | 7.02 | OK |
| primary-fg sobre cognac | 4.74 | OK |
| cognac texto / bg | 4.74 | OK |
| cognac texto / surface | 4.43 | FALHA p/ texto (não usado — restringir texto cognac ao `background`) |
| cognac texto / surface-warm | 4.17 | FALHA p/ texto (não usado) |
| focus-ring / bg, surface, surface-warm | 4.74 / 4.43 / 4.17 | OK (≥ 3:1) — agora usado em todos os anéis de foco |
| `ring-ring/50` (antes) | 2.01 | Removido do código (A-01) |
| `ring-destructive/20` (antes) | ~1.15 | Removido do `Button`/`Badge` (A-02) |
| destructive-text sobre tints | 4.73–5.66 | OK |
| success/warning text | 5.88–7.84 | OK |
| borda destructive / bg, card | 3.34 / 3.11 | OK |
| `--input` (novo) / bg | **3.52** | OK (antes 1.44 — A-04) |
| `--input` (novo) / card, popover | **3.44** | OK (antes 1.35) |
| `--input` (novo) / surface-warm | 3.39 | OK |
| `--border` `#302e2a` | 1.44 / 1.35 | Inalterado — divisores decorativos, não limite de controle |
| border-strong | 1.99 | Apenas decorativo |
| borda outline `muted-fg/60` | 3.52 / 3.44 | OK |
| CTA cognac desabilitado | ~2.0 | A-13 (registrado) |

Observação: o CSS gerado inclui fallback `--input: var(--muted-foreground)`
para navegadores sem `color-mix` (contraste maior, 7.98:1) e o valor
`color-mix(...)` sob `@supports`.

## 4. Checks de runtime

Servidor: build de produção em `:3149`; backend acessível (build gerou SSG
de 3 slugs a partir da API e `GET /works` respondeu 200).

| # | Check | Resultado | Evidência |
| --- | --- | --- | --- |
| 1 | Tab por todas as rotas em 375/768/1280, forced-colors | Não verificado — requer navegador | Estático: nenhum `ring-ring/50`, `outline-ring/50` ou `outline-none` no HTML de `/`, `/portfolio`, `/portfolio/reforma-civic-g10`, `/services`, `/about`, `/contact`, `/qualquer-rota`; `ring-focus-ring` presente (40–44 ocorrências por página pública). CSS gerado: `.outline-hidden` tem regra `@media (forced-colors:active)` com outline de 2px; base `*{outline-color:var(--focus-ring)}` |
| 2 | A-03: `Input` inválido focado — estilos computados | Não verificado — requer navegador | Estático: `aria-invalid:ring-*` removido de `Input`/`Textarea`/`NativeSelect`; só `aria-invalid:border-destructive` permanece |
| 3 | A-04: borda de campo sobre bg/card/popover, disabled | Parcial | CSS gerado contém `--input:color-mix(in srgb, var(--muted-foreground) 60%, transparent)`; contraste calculado (seção 3). Inspeção visual não verificada — requer navegador |
| 4 | ≤ 1 preload de imagem por página | OK | `<link rel="preload" as="image">`: `/` 1, `/portfolio` 1, `/portfolio/reforma-civic-g10` 1, `/portfolio/reforma-banco-couro-celta` 0, `/services` 1, `/about` 1, `/contact` 0. Identificação do elemento LCP: não verificado — requer navegador |
| 5 | CLS < 0.1 com throttling | Não verificado — requer navegador | — |
| 6 | Soft-404 | OK | `curl -I /portfolio/slug-inexistente` → `HTTP/1.1 404`; conteúdo "Project not found" + "Back to portfolio" no payload RSC (segmento). `curl -I /qualquer-rota` → `HTTP/1.1 404`; HTML contém `<main>` com `h1` "Page not found", texto em inglês, link "Back to home" com `focus-visible:ring-focus-ring`, `<title>Page not found \| CarShop</title>`. Nenhuma ocorrência de "Página não encontrada" |
| 7 | Erro de render → novo `app/error.tsx` | Não verificado em runtime | Backend não pertence a esta execução (não foi derrubado); rotas públicas são ISR. Coberto por `app/error.test.tsx` (h1, copy, `reset`, link, `console.error`) |
| 8 | Responsivo 375/768/1024/1280/1440 | Não verificado — requer navegador | Estático: `NativeSelect` agora `h-9`, alinhado ao `Input` |
| 9 | Fluxos de teclado (menu mobile, lightbox, drawer, diálogos, upload, comentário) | Não verificado — requer navegador | Nenhuma alteração em refs, `key`s, handlers ou `onCloseAutoFocus`; suíte existente de foco/teclado verde |
| 10 | Emulação de reduced motion | Não verificado — requer navegador | Estático: CSS gerado contém `motion-reduce:data-open:animate-none`; classes em overlay/conteúdo de dialog, alert-dialog e sheet |
| 11 | Toasts no tema escuro / 375px | Não verificado — requer navegador | A-15 registrado |
| 12 | A-18 zoom no iOS | Não verificado — requer dispositivo real | A-18 registrado |
| 13 | `lint`, `typecheck`, `build`, `test` | OK | lint 0 problemas; typecheck 0 erros; build OK (rotas geradas); Vitest 110 arquivos / 866 testes passando (após tester; developer: 104/845). Build reexecutado pelo reviewer: 1ª execução falhou no SSG de `/portfolio/gol spfc` por 429/503 do backend (ambiental, pré-existente), 2ª OK |

## 5. Débitos conhecidos e itens "aparentemente resolvidos"

Conhecidos (inalterados): `priority` remanescente na Home
(`home-hero.tsx`), lead de `/portfolio` (`portfolio-grid.tsx`) e admin;
nenhum `Button` ≥ 44px por tamanho próprio; `/portfolio/error.tsx` ainda usa
`reset`; `Skeleton` `<div>` dentro de `<output>` em `AdminLoadingState`;
texto "remover" em `delete-work-image-error.ts`; `docs/rules/ui-design-system.md`
desatualizado; `Badge` `h-5` (watch item ≥ 1400px); foco não vai ao `h1`
após excluir um work; footer pt-BR e idioma misto no admin; `dark:*` morto
nos primitives; slug legado "gol spfc" (listado e gerado no build — bug de
backend/dados).

Reclassificados e corrigidos nesta task: dois tokens de foco (A-01/A-02);
`NativeSelect` `h-8` (A-08).

Aparentemente resolvido: `lucide-react` fora de `components/ui` —
`mobile-nav` e `gallery-lightbox` usam `react-icons/lu`; lucide apenas em
`components/ui/dialog.tsx` e `sheet.tsx`. Confirmação a cargo do `reviewer`.

Observações novas desta execução (nenhuma é HIGH/BLOCKER):

- **CSS morto gerado a partir de `specs/`**: o Tailwind v4 faz auto-scan do
  repositório e gera `.ring-ring/50`, `.outline-ring/50`,
  `.supports-backdrop-filter:backdrop-blur-xs` etc. a partir dos
  `specs/**/plan.md`. Nenhum elemento renderizado usa essas classes
  (verificado no HTML). Impacto: só peso de CSS. Possível ajuste futuro:
  `@source not "../specs";` em `globals.css` (LOW, sugerido para FU-4).
- `Button` e `Badge` ainda têm `aria-invalid:ring-destructive/*` na base.
  Nenhum call-site passa `aria-invalid` para esses componentes hoje, então
  o conflito de A-03 não se manifesta; fora do escopo de A-03 (que listava
  só campos). LOW, sugerido para FU-4.
- `/admin/login` faz bailout para renderização no cliente
  (`useSearchParams` com `Suspense`) — HTML inicial sem `<main>`/`h1`.
  Comportamento pré-existente, não alterado aqui.
- `/portfolio/[slug]` inexistente mantém `<title>CarShop</title>` (o
  `not-found.tsx` do segmento não define metadata). Pré-existente; LOW.

## 6. Follow-ups propostos (pendentes de validação do usuário)

| ID | Tema | Achados |
| --- | --- | --- |
| FU-1 | Touch targets e tamanhos de `Button` | A-16, A-17, débito "nenhum `Button` ≥ 44px" |
| FU-2 | Idioma e labels acessíveis | A-14, A-25, footer pt-BR (conhecido), A-19 |
| FU-3 | Toasts no design system | A-15 |
| FU-4 | Consistência de primitives/tipografia | A-11, A-12, A-18, A-20, A-21 (+ observações da seção 5: `@source not` para `specs/`, `aria-invalid` em `Button`/`Badge`) |
| FU-5 | Refinamentos da nav pública | A-13, A-22, A-23, A-24, A-26, A-27 |

Criação no Notion: `task-manager`, somente após validação explícita do
usuário.

## 7. Regressões funcionais

Nenhuma encontrada. Suíte completa verde após as mudanças; nenhuma
alteração de contrato HTTP, auth, query keys, mutações, refs ou retornos de
foco.

## 8. Limitações e limpeza

- Sem navegador nesta execução: checks 1, 2, 5, 8, 9, 10, 11 e parte de 3/4
  ficam para o `reviewer`/usuário com a app rodando. Check 12 exige iOS
  real.
- Check 7 não exercitado em runtime (o backend não foi derrubado).
- Servidor próprio: `next start -p 3149` (PIDs `npx` 27907 / `node`
  27927), encerrado ao final apenas por esses PIDs; porta 3149 confirmada
  livre.
- Dev server do usuário em `:3000` (PID 45400) intocado e ainda escutando
  ao final.
- Nenhum valor de variável de ambiente registrado neste relatório.

## 8. Achados adicionais do reviewer (não bloqueantes)

Veredito do reviewer: **APROVADO COM RESSALVAS**. Sem findings bloqueantes.

| ID | Severidade | Onde | Descrição | Destino |
|---|---|---|---|---|
| R-01 | MEDIUM | `app/(admin)/admin/(protected)/_components/admin-nav-link.tsx:31`; `app/(admin)/admin/(protected)/comentarios/_components/comment-moderation-panel.tsx:183` | `outline-none` remanescente em elementos focáveis; o foco some em forced-colors. Trocar por `outline-hidden`. | FU-4 |
| R-02 | LOW | `components/ui/button.tsx:7`; `components/ui/badge.tsx:7` | `aria-invalid:ring-destructive/20` vem depois de `focus-visible:ring-focus-ring` no CSS gerado; risco latente (nenhum call-site passa `aria-invalid`). Remover e incluir no guard test. | FU-4 |
| R-03 | LOW | `app/globals.css` | Tailwind escaneia `specs/**` e gera CSS morto (`backdrop-blur-xs`, `ring-ring/50`, `outline-ring/50`). Sugestão: `@source not "../specs";` (avaliar `docs/`). | FU-4 |
| R-04 | LOW | `components/ui/dialog.tsx:64`; `components/ui/alert-dialog.tsx:61` | `outline-none` no content dos diálogos (impacto mínimo). | FU-4 |
| R-05 | LOW | build | `npm run build` depende do backend ao vivo; falha no SSG sob 429/503. Pré-existente. | Débito registrado |

### Validação manual pendente (antes de `Done`)

- Tab em `/`, `/portfolio/[slug]` (lightbox), menu mobile, `/admin/comentarios` (diálogos/sheet) e login com campo inválido focado (A-03).
- DevTools: `prefers-reduced-motion` e `forced-colors: active`.
- Lighthouse/Performance em `/` (LCP/CLS).
- 375 / 768 / 1280 px, incluindo toasts.
