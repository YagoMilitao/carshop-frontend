# CARSHOP-149 — Auditoria visual, responsiva e de acessibilidade pós-redesign

## Referência

Tarefa no Notion: CARSHOP-149 ("Executar auditoria visual, responsiva e de
acessibilidade após o redesign"). Description, DoD (8 itens) e Technical
Notes completos na tarefa — aqui só o essencial.

Sprint 6 · Priority High · 3 pts · Epic UI & Styling · Component: Public
UI, Admin UI, Quality. **Sem Figma** (nenhuma task do redesign —
CARSHOP-142 a 148 — teve Figma aprovado): fonte visual autoritativa é
`docs/design/*` + `docs/rules/ui-design-system.md`, `accessibility.md`,
`responsive.md`.

Dependências: CARSHOP-147 (public, Done/mergeada, PR #38) e CARSHOP-148
(admin, Done). Base: `master` `84b8ca0`.

Objetivo: quality gate final do redesign. Produzir achados **concretos**
(arquivo:linha, rota, breakpoint, severidade), corrigir BLOCKER/HIGH em
código e registrar MEDIUM/LOW. Preferências subjetivas não são bugs
(Technical Notes).

## Inventário de rotas em escopo

Não existe `src/app`; App Router em `app/`.

### Públicas — `app/(public)/` (shell: `layout.tsx`, Header/Footer)

| Rota | Arquivo |
| --- | --- |
| `/` | `app/(public)/page.tsx` (+ `_components/home-hero`, `featured-works`, `project-preview`) |
| `/portfolio` | `app/(public)/portfolio/page.tsx` (+ `error.tsx`, `_components/portfolio-grid`) |
| `/portfolio/[slug]` | `app/(public)/portfolio/[slug]/page.tsx` (+ `error.tsx`, `not-found.tsx`, `project-gallery`, `comment-form`, `components/gallery/*`) |
| `/services` | `app/(public)/services/page.tsx` (+ `service-category-row`) |
| `/about` | `app/(public)/about/page.tsx` |
| `/contact` | `app/(public)/contact/page.tsx` |

### Admin — `app/(admin)/admin/`

| Rota | Arquivo |
| --- | --- |
| `/admin/login` | `login/page.tsx` + `login/layout.tsx` |
| `/admin` | `(protected)/page.tsx` (dashboard) |
| `/admin/trabalhos` | `(protected)/trabalhos/page.tsx` (lista, upload/remoção de imagens, exclusão) |
| `/admin/trabalhos/novo` | `(protected)/trabalhos/novo/page.tsx` |
| `/admin/trabalhos/[slug]/editar` | `(protected)/trabalhos/[slug]/editar/page.tsx` |
| `/admin/comentarios` | `(protected)/comentarios/page.tsx` (filtro, paginação, diálogos) |
| Shell | `(protected)/layout.tsx`, `_components/admin-*` (sidebar, mobile nav, header, account menu) |

### Globais

`app/layout.tsx`, `app/error.tsx`, `app/not-found.tsx`, primitives em
`components/ui/*` (compartilhados Public/Admin), estados loading/error/empty
de cada rota, diálogos, sheet, lightbox e toasts (`sonner`).

Breakpoints: mobile (~375px), tablet (~768px), desktop (≥1280px), além da
transição `lg` do shell admin (sidebar vs sheet).

## Checklist da auditoria (derivado do DoD + docs)

1. **Design system** — tipografia (`typography.md`: display só no Public,
   escala semântica, "Admin Typography", "Forbidden Typography Patterns"),
   cores (`colors.md`: uso do cognac, tokens semânticos, sem hex/cores
   Tailwind cruas), spacing (`spacing.md`: `PageSection`/`Container`,
   "Arbitrary Value Rule", "Admin Spacing"), components (`components.md`:
   buttons, forms, cards, badges, radius, shadows, estados, "Admin Status",
   "Delete Confirmation").
2. **Anti-SaaS** (`visual-direction.md` "Anti-SaaS Rule", "Shape
   Language") — glassmorphism, gradientes aleatórios, excesso de
   cards/pills/radius/shadows, CTAs azuis genéricos.
3. **Consistência entre páginas** — mesmos primitives/tokens para mesmos
   papéis; estados (hover/focus/active/disabled/loading/error/empty).
4. **Responsivo** — mobile/tablet/desktop em todas as rotas acima, com a
   app rodando (porta própria, sem derrubar o dev server do usuário);
   overflow horizontal, quebra de tipografia, touch targets ≥ 44px.
5. **Imagens** (`imagery.md`, `components.md` "Image Loading") — aspect
   ratio fixo, `alt` significativo, `sizes` por breakpoint, no máximo uma
   imagem com `preload` por página (LCP), ausência de CLS, apenas
   fotografia real de works (Cloudinary, único `remotePattern`); não há
   imagens estáticas em `public/`.
6. **Acessibilidade** — teclado e ordem de tab, foco visível
   (`focus-ring`), contraste WCAG AA, landmarks (um `<main>` por página,
   `header`/`nav`/`footer`), um `h1` e hierarquia de headings, labels e
   erros de formulário, `motion-safe`/`motion-reduce`, gestão de foco em
   dialogs/sheet/lightbox.
7. **Qualidade** — `npm run lint`, `typecheck`, `build`, `test`;
   regressões funcionais encontradas são registradas.

### Sinais preliminares (a confirmar na auditoria, não são achados ainda)

- `components/ui/dialog.tsx`, `alert-dialog.tsx`, `sheet.tsx`: overlay com
  `backdrop-blur-xs` (avaliar contra a regra de glassmorphism); só
  `dialog.tsx` tem `motion-reduce` no overlay.
- `components/gallery/gallery-lightbox.tsx`: foco com `ring-ring/50` em vez
  do token `focus-ring` usado no admin; botões `rounded-full` +
  `shadow-md` + `bg-background/80`.
- `app/error.tsx`, `app/not-found.tsx`, `portfolio/**/error.tsx`,
  `not-found.tsx`: não foram alvo explícito de 143–148 — verificar idioma e
  aderência ao design system.

## Abordagem

1. **Auditoria (read-only)** — percorrer rotas × breakpoints × checklist e
   produzir um registro de achados, cada um com: ID, rota, breakpoint,
   `arquivo:linha`, regra/doc violado (seção), evidência, severidade e
   ação proposta.
   Severidade:
   - **BLOCKER** — impede uso/acesso (ex.: fluxo inacessível por teclado,
     conteúdo ilegível, quebra de layout que esconde ação primária, build
     quebrado).
   - **HIGH** — violação clara de regra de `docs/design`/acessibilidade
     (ex.: contraste abaixo de AA, foco invisível, CLS relevante, `alt`
     ausente, padrão proibido explícito).
   - **MEDIUM** — inconsistência real com impacto moderado.
   - **LOW** — refinamento menor.
   Preferência subjetiva sem regra documentada → não é achado.
2. **Correção** — `developer` corrige todos os BLOCKER/HIGH, com mudanças
   mínimas e localizadas, sem redesign.
3. **Registro** — MEDIUM/LOW (e regressões funcionais) ficam em
   `specs/CARSHOP-149/audit-report.md` (precedente:
   `specs/CARSHOP-115/validation-report.md`). Criação de tasks no Notion
   para eles só com validação do usuário (`task-manager`).
4. **Validação** — `tester` (testes ajustados/novos, cobertura ≥ 80% no
   código alterado) e `reviewer` (revisão visual final confirmando zero
   BLOCKER/HIGH remanescentes).

## Escopo

- Auditoria de todas as rotas/estados listados, nos três breakpoints.
- Correção de BLOCKER/HIGH em `app/**` e `components/**`.
- `audit-report.md` com todos os achados e o status de cada um.

## Fora de escopo

- Novas funcionalidades, rotas, conteúdo de negócio ou imagens (nada
  inventado).
- Redesign de telas ou reversão de decisões aprovadas em 142–148 (ex.:
  "Get a Quote" desabilitado, labels `Published`/`Draft`, desvios do
  ADR-010, copy pública em inglês). Se uma decisão aprovada violar
  `docs/design`, registrar como conflito, não corrigir silenciosamente.
- Mudanças de contrato HTTP, auth, query keys ou lógica de mutação.
- Adicionar dependências (ex.: axe, Playwright, Lighthouse CI) — não estão
  em `package.json`; se desejado, é decisão do usuário (branch `build`).
- Correção de MEDIUM/LOW (salvo se trivial e aprovado).

## Critérios de aceite (derivados do DoD)

1. Todas as rotas públicas e admin do inventário auditadas em
   mobile/tablet/desktop contra `docs/design/*` (sem Figma — registrado).
2. `audit-report.md` com achados concretos (arquivo:linha, severidade).
3. Zero BLOCKER/HIGH visuais ou de acessibilidade remanescentes.
4. Tipografia, cores, spacing, buttons, forms, surfaces e estados
   consistentes; nenhum padrão anti-SaaS sem justificativa registrada.
5. Imagens verificadas (aspect ratio, alt, sizes, LCP/CLS, origem real).
6. Teclado, foco, contraste e landmarks revisados.
7. `lint`, `typecheck`, `build` e testes relevantes passam; regressões
   funcionais registradas.

## Conflitos / pontos em aberto (sinalizar ao usuário)

1. **Sprint**: propriedade diz Sprint 6; Technical Notes dizem "fechamento
   visual da Sprint 5". Não afeta o escopo; o usuário decide se corrige a
   propriedade/nota no Notion.
2. **Quem executa a auditoria**: o DoD diz "Reviewer compara as telas", mas
   as Technical Notes pedem para "não substituir tester/reviewer" e usar o
   workflow normal, e o `reviewer` roda só ao final. Proposta: a auditoria
   inicial (read-only) é feita pelo `architect` (já dono da estratégia
   visual e read-only), gerando o registro de achados; `developer` corrige;
   `reviewer` faz a verificação final. Alternativa: rodar o `reviewer` duas
   vezes (auditoria inicial + revisão final). **Decisão do usuário.**
3. **MEDIUM/LOW**: confirmar se ficam só no `audit-report.md` ou se o
   usuário quer tasks de follow-up no Notion.
4. **Auditoria automatizada**: não há axe/Lighthouse instalados; a
   verificação de contraste/LCP/CLS será manual (DevTools na app rodando).
   Confirmar se isso é suficiente.

## Riscos

- Correções em `components/ui/*` afetam Public e Admin — checar todos os
  call-sites e testes.
- Mudanças de copy/markup quebram testes baseados em texto; ajustar sem
  alterar asserções de comportamento.
- Gestão de foco em dialogs/lightbox/admin é sensível (CARSHOP-35/148).
- Escopo de correção só é conhecido após a auditoria; se os BLOCKER/HIGH
  forem numerosos, reavaliar com o usuário antes de expandir.

## Branch sugerida

`fix/CARSHOP-149-post-redesign-ui-audit` — ver justificativa no relatório.

## Classificação de tamanho

**NON-TRIVIAL** — abrange todas as rotas públicas e admin, primitives
compartilhados e um volume de correções só conhecido após a auditoria;
exige decisão de workflow (ponto 2) e um plano que estruture auditoria →
triagem → correção → validação. Plano persistido obrigatório.

## Próximos agentes

- `knowledge-reader`: recomendado — decisões registradas no Obsidian de
  CARSHOP-142 a 148 (evitar reabrir decisões aprovadas como "achados").
- `architect`: obrigatório — auditoria inicial read-only (se o usuário
  aprovar o ponto 2) e decisão sobre os sinais preliminares (ex.:
  `backdrop-blur` nos overlays).
- `plan-writer`: obrigatório — fases: (1) auditoria e registro, (2)
  triagem com o usuário, (3) correções BLOCKER/HIGH, (4) testes e
  validação visual, (5) revisão final.
