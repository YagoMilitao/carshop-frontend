# CARSHOP-149 — Plano de implementação: Auditoria visual, responsiva e de acessibilidade pós-redesign

Task classificada como **NON-TRIVIAL** pelo `spec-writer`
(`specs/CARSHOP-149/spec.md`). Este plano persiste fielmente a auditoria
inicial do `architect` (read-only, estática) e a triagem feita pelo usuário,
traduzindo-as em passos acionáveis para o `developer`. Nenhuma decisão
arquitetural ou visual nova é introduzida aqui.

Sem Figma: fonte visual autoritativa é `docs/design/*` +
`docs/rules/accessibility.md`, `responsive.md` (e
`docs/rules/ui-design-system.md`, sabidamente desatualizado — ver Débitos).

Branch (já criada): `fix/CARSHOP-149-post-redesign-ui-audit`.
**Não commitar** — commit só a pedido explícito do usuário.

Este plano é autocontido: os artefatos intermediários do `architect` e do
`knowledge-reader` eram temporários e todo o conteúdo necessário está
transcrito abaixo. Números de linha refletem `master` `84b8ca0`; **confirmar
no repositório antes de editar** (podem ter deslocado).

## Decisões do usuário (vinculantes)

1. **Workflow da auditoria**: o `architect` fez a auditoria inicial
   (read-only); o `developer` corrige; o `reviewer` é o gate final
   (confirma zero BLOCKER/HIGH remanescentes e faz a revisão visual).
2. **MEDIUM/LOW**: registrados em `specs/CARSHOP-149/audit-report.md` **e**
   propostos como follow-ups no Notion (FU-1..FU-5). As tasks só são criadas
   pelo `task-manager` **após validação explícita do usuário**.
3. **Sem axe/Lighthouse** (não estão em `package.json`; não adicionar
   dependências). Verificações de contraste, LCP, CLS e teclado são manuais,
   com a app rodando.
4. **Conflito C-1 aprovado**: separar `--input` de `--border`:
   `--input: color-mix(in srgb, var(--muted-foreground) 60%, transparent)`
   (~3.52:1 sobre `background`, ~3.44:1 sobre `card`). `--border` **não
   muda**.
5. **A-08, A-09 e A-10 (MEDIUM) incluídos** nesta task.
6. **Nenhum BLOCKER** encontrado. Correções em escopo: **A-01..A-07 (HIGH)
   + A-08, A-09, A-10**.
7. Breakpoint `lg` do shell admin (sidebar vs sheet): **manter**.

### Conflitos registrados

- **C-1** — `--input` compartilhava o valor de `--border` (`#302e2a`,
  1.44:1) — resolvido pela decisão 4.
- **C-2** — a coexistência de dois tokens de foco (`ring-focus-ring` vs
  `ring-ring/50`), antes débito conhecido de CARSHOP-148, foi
  **reclassificada como HIGH** (A-01/A-02) por contraste < 3:1.
- **C-3** — `app/not-found.tsx` e `app/error.tsx` atendem Public (en-US) e
  Admin (pt-BR). Escolhido **inglês** (idioma do `<html lang="en-US">`);
  boundary pt-BR do admin fica como follow-up (A-19 / FU-2).

## Decisões de sinal do architect (fonte de verdade — não reinterpretar)

- **S1 — Glassmorphism nos overlays**: `backdrop-blur-xs` em overlays é
  glassmorphism (proibido: `visual-direction.md` "Anti-SaaS Rule",
  `components.md`). Remover `supports-backdrop-filter:backdrop-blur-xs` dos
  overlays de `dialog`/`alert-dialog`/`sheet`; `bg-black/10` →
  `bg-background/80`. Conteúdo do lightbox `bg-background/95` → `bg-background`
  opaco.
- **S2 — Token de foco canônico**: `focus-ring` em opacidade total.
  Substituir todo `focus-visible:ring-ring/50` →
  `focus-visible:ring-focus-ring`; `outline-none` → `outline-hidden` (preserva
  outline em forced-colors); base `* { outline-ring/50 }` →
  `outline-focus-ring`; remover overrides de foco do `destructive`.
- **S3 — Botões do lightbox**: manter `bg-background/80`; `rounded-full` →
  `rounded-lg`; remover `shadow-md`; setas sobre a foto usam
  `ring-focus-ring ring-offset-2 ring-offset-background`.
- **S4 — NativeSelect**: default `h-8` → `h-9`; `text-sm` → `text-body-sm`;
  manter `data-[size=sm]`.
- **S5 — Reduced motion nos overlays**: adicionar
  `motion-reduce:data-open:animate-none motion-reduce:data-closed:animate-none`
  em `alert-dialog.tsx:43,61`, `sheet.tsx:40,65`, `dialog.tsx:64`.
- **S6 — Páginas de erro**: `app/not-found.tsx` e `app/error.tsx` são HIGH
  (A-06/A-07); `portfolio/**/error.tsx` e `not-found.tsx` estão conformes.

## Achados em escopo (corrigir)

### A-01 (HIGH) — Anel de foco `ring-ring/50` com contraste 2.01:1 (< 3:1)

Arquivos / linhas:

- `components/layout/header.tsx:13,25`
- `components/layout/mobile-nav.tsx:42`
- `components/layout/footer.tsx:36,54`
- `app/(public)/_components/home-hero.tsx:58`
- `app/(public)/_components/featured-works.tsx:37`
- `app/(public)/_components/project-preview.tsx:65`
- `app/(public)/portfolio/_components/portfolio-text-entry.tsx:15`
- `app/(public)/portfolio/_components/portfolio-state-message.tsx:45`
- `app/(public)/portfolio/[slug]/_components/back-to-portfolio-link.tsx:9`
- `app/(public)/portfolio/[slug]/_components/project-gallery.tsx:93`
- `app/(public)/portfolio/[slug]/comment-form.tsx:124` (textarea cru —
  apenas trocar o foco; **não** migrar para o primitive `Textarea`, isso é
  A-12/FU-4)
- `app/(public)/services/_components/service-category-row.tsx:19`
- `app/(public)/about/page.tsx:27`
- `app/(public)/contact/_components/contact-follow-links.tsx:27`
- `components/gallery/gallery-lightbox.tsx:101,133,141` (ver também A-10)
- `components/ui/input.tsx:10`, `components/ui/textarea.tsx:9`,
  `components/ui/native-select.tsx:26`, `components/ui/badge.tsx:7`
- `app/globals.css:229` (base `outline-ring/50`)

Correção: `focus-visible:ring-ring/50` → `focus-visible:ring-focus-ring`;
`outline-none` → `outline-hidden` nos mesmos elementos; base em
`globals.css` → `outline-focus-ring`. Ao final, **grep por qualquer
`ring-ring/50` ou `outline-ring/50` remanescente** em `app/` e
`components/` e corrigir também.

### A-02 (HIGH) — Foco do `Button` (`components/ui/button.tsx:7,20`)

- Variante `default`: borda de foco da mesma cor do preenchimento (anel
  invisível contra o próprio botão).
- Variante `destructive`: `ring-destructive/20` ~1.15:1.

Correção: na base,
`focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background`;
na variante `destructive`, remover
`focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40`.
Preservar customizações aprovadas (`outline` com
`border-muted-foreground/60`, `active:scale-[0.97]` neutralizado por
`motion-reduce`).

### A-03 (HIGH) — `aria-invalid` sobrescreve o anel de foco

`components/ui/input.tsx:10`, `textarea.tsx:9`, `native-select.tsx:26`: pela
ordem de variantes do Tailwind v4, `aria-invalid:ring-*` vence o
`focus-visible:ring-*`, então um campo inválido focado não mostra foco.

Correção: remover `aria-invalid:ring-3 aria-invalid:ring-destructive/20` (e o
`dark:` correspondente, que é código morto — não existe classe `.dark`);
manter `aria-invalid:border-destructive` (3.34:1). Confirmar em runtime via
estilos computados (check 2).

### A-04 (HIGH) — `--input` com contraste 1.44:1

`app/globals.css:40` — `--input` `#302e2a` (1.44:1 sobre `background`,
1.35:1 sobre surface). Consumido por `input`, `textarea`, `native-select` e
pelo textarea do `comment-form`.

Correção (C-1 aprovado):
`--input: color-mix(in srgb, var(--muted-foreground) 60%, transparent);` com
comentário de contraste (~3.52:1 bg / ~3.44:1 card). `--border` inalterado.

### A-05 (HIGH) — Glassmorphism nos overlays e no lightbox

- `components/ui/dialog.tsx:42` (overlay) e
  `components/gallery/gallery-lightbox.tsx:78` (conteúdo `bg-background/95`).
- Mesma mudança de overlay em `components/ui/alert-dialog.tsx:43` e
  `components/ui/sheet.tsx:40`.

Correção (S1): remover `supports-backdrop-filter:backdrop-blur-xs`;
`bg-black/10` → `bg-background/80`; conteúdo do lightbox → `bg-background`.

### A-06 (HIGH) — `app/not-found.tsx`

Copy pt-BR sob `lang="en-US"` (`app/layout.tsx:43`), sem estilo, beco sem
saída.

Correção: `<main>` + `Container variant="page"`; `h1`
`text-heading-1 text-foreground`; texto de apoio
`text-body text-secondary-foreground`; link "Back to home" estilizado como o
`BackToHomeLink` existente (**inline**, sem importar de
`portfolio/_components`), com `focus-visible:ring-focus-ring`; copy em
inglês; `metadata.title`. Não inventar informação de negócio.

### A-07 (HIGH) — `app/error.tsx`

Mesmos problemas de A-06, além de `<button>` cru.

Correção: mesmo padrão de A-06; `Button` "Try again" chamando `reset`; link
para home; `console.error(error)` (em efeito). Copy em inglês.

Testes: atualizar `app/error.test.tsx` e `app/not-found.test.tsx` (hoje
assertam texto pt-BR) para a nova copy/estrutura, sem enfraquecer asserções
de comportamento (ex.: `reset` chamado ao clicar em "Try again").

### A-08 (MEDIUM, incluído) — `components/ui/native-select.tsx:26`

Aplicar S4: default `h-8` → `h-9` (alinha com `Input`); `text-sm` →
`text-body-sm`; manter `data-[size=sm]`.

### A-09 (MEDIUM, incluído) — Reduced motion nos overlays

Aplicar S5 em `alert-dialog.tsx:43,61`, `sheet.tsx:40,65`, `dialog.tsx:64`.

### A-10 (MEDIUM, incluído) — Botões do lightbox

`components/gallery/gallery-lightbox.tsx:101,133,141`: aplicar S3
(`rounded-full` → `rounded-lg`, remover `shadow-md`, manter
`bg-background/80`, setas com
`ring-focus-ring ring-offset-2 ring-offset-background`). Manter `size-11`,
`showCloseButton={false}`, as duas camadas de reduced motion
(`useReducedMotion` + `motion-reduce:data-*:animate-none`) e o retorno de
foco à origem.

## Achados registrados (não corrigir nesta task)

Registrar todos em `audit-report.md` com status "Registrado → FU-N".

### MEDIUM

- **A-11** — Títulos de Dialog/AlertDialog/Sheet em Barlow
  (`dialog.tsx:133`, `alert-dialog.tsx:107`, `sheet.tsx:117`); tipografia
  admin pede Manrope. Proposta: `font-sans text-body font-semibold`.
- **A-12** — `comment-form.tsx:120-126` usa `<textarea>` cru em vez do
  primitive `Textarea` (faltam estilos `aria-invalid`/`disabled`).
- **A-13** — "Get a Quote" desabilitado em cognac `opacity-50` (~2.0:1) em
  `header.tsx:34-41`, `mobile-nav.tsx:52-60`, `button.tsx:7` vs
  `colors.md` "Disabled State". (Decisão aprovada de manter desabilitado —
  apenas o tratamento visual é achado.)
- **A-14** — `aria-label`s em pt-BR em páginas en-US: `header.tsx:19`,
  `mobile-nav.tsx:22,35`, `footer.tsx:30,46` (WCAG 3.1.2).
- **A-15** — `app/layout.tsx:48` `<Toaster richColors>`: tema claro do
  sonner/cores (info azul) fora dos tokens.
- **A-16** — Touch targets públicos: links da nav do header ~19px em md
  (`header.tsx:25`); links do footer ~21px com `gap-2`
  (`footer.tsx:36,54`).
- **A-17** — Touch targets admin: `Button size="sm"` `h-7`;
  `admin-mobile-nav.tsx:47` ícone 32px; `sheet.tsx:76` close `icon-sm` 28px.
- **A-18** — Inputs com 14px no mobile → zoom no iOS (`input.tsx:10`
  `text-body-sm`, textarea do `comment-form`).
- **A-19** — Não há `error.tsx` admin; após A-07 erros do admin mostram o
  boundary em inglês. Proposta: `app/(admin)/admin/(protected)/error.tsx`
  pt-BR com `AdminErrorState`.

### LOW

- **A-20** — `components/ui/skeleton.tsx:7` `animate-pulse` sem
  `motion-reduce` no primitive.
- **A-21** — Tamanhos Tailwind crus: `mobile-nav.tsx:42`,
  `gallery-lightbox.tsx:151`, `dialog.tsx:149`, `alert-dialog.tsx:123`,
  `sheet.tsx:132`, `card.tsx:14`, `textarea.tsx:9`.
- **A-22** — `mobile-nav.tsx:31` `shadow-md` no painel público.
- **A-23** — Links sociais do footer abrem em nova aba sem "(opens in a new
  tab)" (`footer.tsx:50-57`).
- **A-24** — Nav pública sem `aria-current` (`header.tsx:23`,
  `mobile-nav.tsx:39`).
- **A-25** — "Close" em inglês no admin pt-BR (`sheet.tsx:80`,
  `dialog.tsx:79`).
- **A-26** — Menu mobile público não fecha com Esc.
- **A-27** — Sem skip link (melhoria).

## Follow-ups propostos (Notion — só com validação do usuário)

| ID | Tema | Achados |
| --- | --- | --- |
| FU-1 | Touch targets e tamanhos de `Button` | A-16, A-17, débito "nenhum `Button` ≥ 44px" |
| FU-2 | Idioma e labels acessíveis | A-14, A-25, footer pt-BR (conhecido), A-19 |
| FU-3 | Toasts no design system | A-15 |
| FU-4 | Consistência de primitives/tipografia | A-11, A-12, A-21, A-20, A-18 |
| FU-5 | Refinamentos da nav pública | A-13, A-22, A-23, A-24, A-26, A-27 |

Criação no Notion: responsabilidade do `task-manager`, **somente após
validação explícita do usuário**.

## Decisões aprovadas (não são achados)

Para evitar reabrir decisões de CARSHOP-142..148:

- Copy pública em inglês; `category` exibida verbatim da API. Admin em
  pt-BR, exceto status de work "Published"/"Draft".
- "Get a Quote" desabilitado (`aria-disabled`, "coming soon"); CTA primário
  "View Our Work" → `/portfolio`.
- Ausências intencionais: depoimentos, antes/depois, stats, telefone/
  endereço/horário/e-mail, descrições/preços de serviço; Contact sem form.
- Imagens: no máximo **um** preload por página; frames fixos por papel;
  lightbox `object-contain`; alternância de layout por span/papel (Services
  usa `lg:contents`), nunca CSS `order`.
- Sem `loading.tsx` em `portfolio/` (soft-404); `/portfolio` error sem retry
  inline (ISR).
- `Button` `outline` com `border-muted-foreground/60`; press
  `active:scale-[0.97]` com `motion-reduce`.
- Tokens `-text` (`--destructive-text`, `--success-text`, `--warning-text`)
  intencionais.
- Tema escuro é o `:root` (sem classe `.dark`) → `dark:*` é código morto.
- Hover zoom `motion-safe:group-hover:scale-[1.02]`.
- Gutter `px-5 sm:px-8` do `Container` reading; foto do About sai para
  largura de página a partir de `lg`.
- Shell admin: breakpoint `lg` mantido.

## Débitos conhecidos (não são achados novos — registrar como "conhecido")

- `priority` remanescente na Home (`home-hero.tsx:49`), lead de `/portfolio`
  (`portfolio-grid.tsx:67`) e admin.
- Nenhum `Button` com tamanho ≥ 44px (CTA da Home usa `h-11` local).
- `/portfolio/error.tsx` ainda usa `reset`.
- `Skeleton` `<div>` dentro de `<output>` em `AdminLoadingState`.
- Texto "remover" em `delete-work-image-error.ts`.
- `docs/rules/ui-design-system.md` desatualizado.
- `Badge` `h-5` pode cortar em ≥ 1400px (watch item).
- Foco não vai para o `h1` após excluir um work.
- Footer pt-BR; idioma misto no admin.
- `dark:*` morto nos primitives.
- Slug legado "gol spfc" listado mas 404 no detalhe = bug de backend/dados.
- Reclassificados nesta task: dois tokens de foco → A-01/A-02; NativeSelect
  `h-8` → A-08.
- **Aparentemente resolvido**: `lucide-react` fora de `components/ui`
  (`mobile-nav` e `gallery-lightbox` já usam `react-icons/lu`; lucide só em
  `components/ui/dialog.tsx:8` e `sheet.tsx:8`) — o `reviewer` confirma.

## Arquivos a tocar

- `app/globals.css` — `--input` (A-04), base `outline-focus-ring` (A-01).
- `components/ui/button.tsx` (A-02), `input.tsx`, `textarea.tsx`,
  `native-select.tsx` (A-01, A-03, A-08), `badge.tsx` (A-01).
- `components/ui/dialog.tsx`, `alert-dialog.tsx`, `sheet.tsx` (A-05, A-09).
- `components/gallery/gallery-lightbox.tsx` (A-01, A-05, A-10).
- Call-sites de A-01 em `components/layout/*` e `app/(public)/**`.
- `app/not-found.tsx`, `app/error.tsx` + `app/not-found.test.tsx`,
  `app/error.test.tsx` (A-06, A-07).
- Novo: `specs/CARSHOP-149/audit-report.md`.

Primitives em `components/ui/*` são editados de forma pontual (troca de
classes) — não regenerar via CLI shadcn nem aceitar overwrite.

Nenhuma nova fronteira Server/Client: `app/error.tsx` continua Client
(exigência do Next.js); `app/not-found.tsx` continua Server.

## Fases de implementação

### Fase 1 — Tokens e base (`app/globals.css`)
1. A-04: `--input` via `color-mix` aprovado, com comentário de contraste.
2. A-01 (base): `* { outline-ring/50 }` → `outline-focus-ring`.

### Fase 2 — Primitives compartilhados (Public + Admin)
1. `button.tsx` (A-02).
2. `input.tsx`, `textarea.tsx`, `native-select.tsx` (A-01, A-03; A-08 no
   select).
3. `badge.tsx` (A-01).
4. Rodar os testes dos primitives e a suíte completa (afeta os dois
   contextos).

### Fase 3 — Overlays e lightbox
1. `dialog.tsx`, `alert-dialog.tsx`, `sheet.tsx`: overlay (A-05) + reduced
   motion (A-09).
2. `gallery-lightbox.tsx`: conteúdo opaco (A-05), botões (A-10), foco com
   offset nas setas (A-01/S3).

### Fase 4 — Substituição mecânica nos call-sites (A-01)
1. Aplicar a troca em todos os arquivos listados em A-01 (incluindo o
   textarea cru do `comment-form`, sem migrá-lo para o primitive).
2. Grep final: zero `ring-ring/50` / `outline-ring/50` em `app/` e
   `components/`.

### Fase 5 — Páginas globais de erro (A-06, A-07)
1. Reescrever `app/not-found.tsx` e `app/error.tsx`.
2. Ajustar `app/not-found.test.tsx` e `app/error.test.tsx`.

### Fase 6 — Validação em runtime e relatório
1. `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test`;
   cobertura ≥ 80% no código alterado quando aplicável.
2. Executar os checks de runtime (abaixo).
3. Produzir `specs/CARSHOP-149/audit-report.md`.
4. Encaminhar ao `tester` e depois ao `reviewer` (gate final).

## Validação em runtime (porta própria)

**Regras obrigatórias:**

- O usuário mantém o próprio dev server na porta **3000**: **nunca** encerrá-lo,
  nunca `pkill "next dev"`, nunca subir outro servidor na 3000. Um segundo
  `next dev` no mesmo diretório é bloqueado por lock.
- Usar `next build && next start -p <porta própria>` (ex.: uma porta livre
  diferente de 3000), registrar o PID e **encerrar somente esse PID** ao
  final.
- Conteúdo de `not-found` de segmento pode aparecer só no payload RSC —
  verificar com `curl` no build de produção.
- Backend: `npm run start:dev` no repositório do backend; `/admin/*` exige
  sessão admin + backend. Se o Atlas rejeitar o IP, sobrescrever a
  variável de conexão do Mongo apenas no shell apontando para um `mongod`
  local (sem registrar valores reais em nenhum artefato).
- São necessários ≥ 5 works com imagens para exercitar os layouts.
- `preload` não emite `fetchpriority=high` (não é defeito).

**Checks:**

1. Tab por todas as rotas em 375/768/1280: `Button` default/outline/ghost/
   destructive, links de texto, links de imagem, thumbs da galeria, setas
   do lightbox sobre fotos, conteúdo de dialogs, headings `tabIndex=-1`,
   modo forced-colors.
2. A-03: `Input` inválido focado — `box-shadow`/`border` computados diferem
   do estado não focado.
3. A-04: borda de campo visível sobre `background`, `card` (login) e popover
   (dialog de edição); estado disabled.
4. LCP/preload: ≤ 1 preload/`priority` por página em `/`, `/portfolio`,
   `/portfolio/[slug]`, `/services`, `/about`; identificar o elemento LCP.
5. CLS < 0.1 com throttling.
6. Soft-404: `curl -I /portfolio/nonexistent` e `/qualquer-rota` → 404 com o
   novo conteúdo de not-found.
7. Backend fora do ar; forçar erro de render para ver o novo `app/error.tsx`.
8. Responsivo 375/768/1024/1280/1440: overflow horizontal, títulos longos,
   `lg:contents` em Services, alinhamento da foto do About, sidebar/drawer
   admin em 1024, cards/paginação admin, dialogs em 375, lightbox
   retrato/paisagem, corte do `Badge` em ≥ 1400.
9. Fluxos de teclado: menu mobile público; lightbox setas/Esc/retorno de
   foco; drawer admin (trap/Esc/retorno/fecha em `lg`); diálogos de exclusão
   (foco inicial em Cancelar e retorno); dialog de edição; retorno de foco
   no upload de imagem; submit inválido do comentário foca o primeiro campo
   com anel visível.
10. Emulação de reduced motion: lightbox, dialog, alert-dialog, sheet,
    skeleton, hover zoom, press.
11. Toasts no tema escuro / 375px.
12. A-18 zoom no iOS — requer dispositivo real (não emulável): registrar
    como "não verificado".
13. `npm run lint`, `typecheck`, `build`, `test`.

## `audit-report.md` (entregável do `developer`)

Arquivo: `specs/CARSHOP-149/audit-report.md`, seguindo o formato de
`specs/CARSHOP-115/validation-report.md` (seções numeradas, tabelas,
limitações, limpeza ao final). Conteúdo mínimo:

1. Contexto (branch, base, sem Figma, fontes usadas, sem axe/Lighthouse).
2. Tabela de achados A-01..A-27: ID, severidade, rota/breakpoint,
   `arquivo:linha`, regra/doc violado, correção aplicada ou ação proposta,
   **status** (Corrigido / Registrado → FU-N / Conhecido).
3. Tabela de contraste (destaques abaixo), recalculada onde houve mudança
   de token.
4. Resultado de cada check de runtime 1–13 (OK / Falha / Não verificado,
   com evidência).
5. Débitos conhecidos e itens "aparentemente resolvidos".
6. Follow-ups FU-1..FU-5 agrupados (pendentes de validação do usuário).
7. Regressões funcionais encontradas (se houver).
8. Limitações e limpeza (porta usada, PID encerrado, servidor do usuário
   intocado).

### Destaques de contraste (auditoria estática)

| Par | Contraste | Status |
| --- | --- | --- |
| foreground / bg | 17.21 | OK |
| muted-fg / bg | 7.98 | OK |
| muted-fg / surface-warm | 7.02 | OK |
| primary-fg sobre cognac | 4.74 | OK |
| cognac texto / bg | 4.74 | OK |
| cognac texto / surface | 4.43 | FALHA (não usado — restringir texto cognac ao `background`) |
| cognac texto / surface-warm | 4.17 | FALHA (não usado) |
| focus-ring / bg, surface, surface-warm | 4.74 / 4.43 / 4.17 | OK (≥ 3:1) |
| `ring-ring/50` | 2.01 | FALHA → A-01 |
| `ring-destructive/20` | ~1.15 | FALHA → A-02 |
| destructive-text sobre tints | 4.73–5.66 | OK |
| success/warning text | 5.88–7.84 | OK |
| borda destructive | 3.34 / 3.11 | OK |
| border/input `#302e2a` | 1.44 / 1.35 | FALHA → A-04 (só `--input`) |
| border-strong | 1.99 | apenas decorativo |
| borda outline `muted-fg/60` | 3.52 / 3.44 | OK |
| CTA cognac desabilitado | ~2.0 | A-13 (registrado) |

## Riscos e cuidados

- Primitives compartilhados por Public e Admin → rodar a suíte completa,
  não só os testes locais.
- `ring-offset` dentro de dialogs mostra um gap `#0c0c0c` sobre `#151515`
  — aceitável (decisão do architect).
- `tailwind-merge`: `ring-focus-ring` + `ring-3` já é usado no admin;
  conferir que o merge não descarta classes nos call-sites com `cn()`.
- Gestão de foco em dialogs/lightbox/admin é sensível (CARSHOP-35/148): não
  alterar refs, `key`s, posição dos diálogos nem retornos de foco.
- Mudanças de copy quebram testes baseados em texto: ajustar sem enfraquecer
  asserções de comportamento.
- Sem mudanças de contrato HTTP, auth, query keys ou lógica de mutação.

## Pontos a confirmar com o usuário durante a implementação

- Nenhum blocker identificado pelo `architect`.
- **Se algum novo achado HIGH/BLOCKER surgir nos checks de runtime**:
  parar e re-escopar com o usuário antes de expandir a task (não corrigir
  silenciosamente fora do escopo aprovado).
- Criação das tasks FU-1..FU-5 no Notion: aguarda validação explícita do
  usuário (`task-manager`).
- Conflito de Sprint (propriedade "Sprint 6" vs nota "Sprint 5"): decisão
  do usuário no Notion; não afeta o escopo.

## Segurança

Nenhum segredo, token ou valor real de `.env` é necessário ou citado neste
plano. Não registrar valores de variáveis de ambiente (ex.: string de
conexão do Mongo) no `audit-report.md` nem em logs.
