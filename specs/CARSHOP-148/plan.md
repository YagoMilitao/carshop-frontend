# CARSHOP-148 — Plano de implementação: Redesenhar experiência visual da área Admin

Task classificada como **NON-TRIVIAL** pelo `spec-writer`
(`specs/CARSHOP-148/spec.md`). Este plano persiste fielmente a decisão do
`architect` e as decisões do usuário, traduzindo-as em passos acionáveis
para o `developer`. Nenhuma decisão arquitetural nova é introduzida aqui.

Sem Figma: fonte visual autoritativa é `docs/design/*` (seções Admin).

## Decisões do usuário (vinculantes)

1. **"Novo trabalho" sai da navegação** e vira CTA primário na lista de
   Trabalhos (`/admin/trabalhos`). "Trabalhos" fica ativo em
   `/admin/trabalhos/novo` e `/admin/trabalhos/[slug]/editar`.
2. **`PendingCommentsList` exibe o título do trabalho** usando a query
   existente `adminWorksQueryKey` (sem novo endpoint).
3. **Labels de status de work em inglês**: "Published" / "Draft", tanto no
   `Badge` quanto nas `<option>`s do `<select>` (reafirma CARSHOP-34).
   Labels de status de comentário continuam em PT-BR.

Observação: o critério de aceite da spec sobre idioma de status ("sempre
com texto em PT-BR") conflita com a decisão 3. A redação alvo aprovada é:
"work status labels come from a single map (`workStatusLabels`), never the
raw enum; values in English: Published/Draft (user decision, reaffirming
CARSHOP-34); comment statuses stay PT-BR". A atualização do `spec.md` é
responsabilidade do `spec-writer` (o `plan-writer` só escreve `plan.md`);
até lá, **este plano e a decisão do usuário prevalecem** sobre o texto
atual da spec nesse ponto.

## Decisão do architect (fonte de verdade — não reinterpretar)

### 1. Navegação
- `admin-nav-links.ts`: remover "Novo trabalho"; adicionar
  `match: "exact" | "prefix"` por item (Dashboard `/admin` → `exact`;
  Trabalhos e Comentários → `prefix`); exportar função pura
  `isAdminNavItemActive(pathname, item)` (`exact` → igualdade; `prefix` →
  igualdade ou `startsWith(href + "/")`).
- `AdminNavLink`: usa `isAdminNavItemActive`; estilo `text-nav`; ativo
  `bg-accent text-foreground` + indicador lateral `primary`; mantém
  `aria-current`; `focus-visible:ring-focus-ring`.
- `AdminSidebar`: marca em texto "CarShop Admin" no topo
  (`text-body-lg font-semibold`); `lg:sticky lg:top-0 lg:h-dvh`; continua
  Server Component.
- `AdminHeader`: marca `lg:hidden`; em lg+ apenas `AdminAccountMenu`
  alinhado à direita.
- `AdminMobileNav`: ícone `Menu` (lucide) → `LuMenu` de `react-icons/lu`;
  manter `SheetTitle` e `aria-label`s.
- CTA "Novo trabalho" apenas no `AdminPageHeader` de `/admin/trabalhos`
  (`Button` variant default).

### 2. Primitives (somente via `npx shadcn add`; nunca escrever `components/ui` à mão)
- `textarea`: adicionar; `min-height` no call site (`min-h-24` no work,
  `min-h-32` no comentário).
- `select` permanece nativo via `npx shadcn add native-select`. **Se o
  registry radix-nova não tiver `native-select`: PARAR e reportar como
  blocker** — sem primitive escrito à mão, sem wrapper paralelo.
- `skeleton`: adicionar; `motion-reduce:animate-none` no uso.
- Sem `table`. Sem `field`/`form` do shadcn.
- Ao rodar a CLI: **não aceitar overwrite** de arquivos existentes
  (`button`, `badge`, `input`, `utils`, `globals.css`); revisar o diff.

### 3. Status
- `Badge`: variante aditiva `warning` = `bg-warning/15 text-warning-text`.
- Novo token `--warning-text` em `app/globals.css` + `--color-warning-text`
  em `@theme inline`, com comentário de contraste. Candidato `#d09a4e`
  (~5.99:1 sobre `bg-warning/15` + surface; ~5.58:1 sobre `surface-warm`) —
  o `developer` deve **recalcular e registrar** o contraste e confirmar que
  é distinguível do cognac `#b56a3b`.
- `comment-status.ts`: `PENDING → warning`, `APPROVED → success`,
  `HIDDEN → secondary` (labels PT-BR mantidas).
- Novo `trabalhos/_components/work-status.ts` com
  `workStatusLabels = { published: "Published", draft: "Draft" }` e
  `workStatusBadgeVariants` (`published → success`, `draft → secondary`),
  consumidos pelo `Badge` de `WorkListItem` e pelas `<option>`s de
  `WorkFormFields`. Nenhum enum cru exibido.

### 4. Ações e terminologia (PT-BR)
- Verbo único: "Excluir".
- `WorkListItem`: "Editar" (`outline` `sm`) + "Excluir trabalho"
  (`destructive` `sm`).
- Grid de imagens: gatilho "Excluir" (`destructive` `sm`) com
  `aria-label="Excluir {actionLabel}"`; diálogo com título "Excluir imagem"
  e ação "Excluir imagem".
- `DeleteWorkDialog`: título/ação "Excluir trabalho"; descrição mantém a
  identificação do item + "Essa ação não pode ser desfeita."; não inventar
  efeitos de backend.
- Textos: "Total de trabalhos", "Nenhum trabalho cadastrado.",
  "Publicados / rascunhos".
- Hierarquia de botões: um primário `default` por grupo, `outline`
  secundário, `destructive`. Nenhuma variante nova de `Button`.
- Rodapé do form de work: "Cancelar" = `Button` `outline` `asChild` +
  `Link` para `/admin/trabalhos`; submit primário; layout
  `flex flex-col-reverse gap-3 sm:flex-row sm:justify-end`.
- Redirect pós-criação para `/admin`: **FORA DE ESCOPO** (não alterar).

### 5. Estados compartilhados
Arquivo `app/(admin)/admin/(protected)/_components/admin-states.tsx` (sem
`"use client"`, apresentacional):
- `AdminLoadingState({ label, rows? })`: `<output aria-busy>` com label
  `sr-only` + linhas de `Skeleton` `aria-hidden` (textos de loading
  permanecem no DOM).
- `AdminErrorState({ message, onRetry?, isRetrying? })`:
  `rounded-lg border border-destructive/40 bg-surface p-4`; `LuCircleAlert`
  `aria-hidden`; mensagem `role="alert"` `text-destructive-text`; botão
  `outline` `sm` "Tentar novamente" chamando `refetch` da query (apenas GET).
- `AdminEmptyState({ title, description?, action? })`:
  `rounded-lg border border-dashed border-border-strong p-6`.
- Aplicar em `AdminWorkList`, `EditWorkForm` (loading / error / not-found
  distintos), `CommentModerationPanel` (incl. explicação de `HIDDEN`),
  `PendingCommentsList`.
- `DashboardSummary`: mantém erro inline por card com `role="alert"`; "…"
  → `Skeleton` com texto `sr-only`.
- Sucesso: mantém `sonner` + `<output>` `sr-only` existente.

### 6. Cabeçalho de página
- Novo `(protected)/_components/admin-page-header.tsx` (Server)
  `{ title, description?, actions? }`: `h1` `text-heading-3`; layout
  `flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`.
- Usado em Dashboard, Trabalhos (`actions` = "Novo trabalho"), Novo,
  Editar, Comentários.
- Subtítulos: `text-body-lg font-semibold` / `text-body`. Espaçamento entre
  blocos `gap-8` (antes `gap-10`).

### 7. Login
- Continua Client, fora do shell.
- `Card` centralizado `w-full max-w-sm` com "CarShop Admin"
  (`text-body-sm font-semibold text-muted-foreground`), `h1` "Entrar no
  painel admin" `text-heading-3`; mesmo formulário (ids, aria, mensagens).
- Fallback do `Suspense`: `LoginFormSkeleton` local no arquivo da página,
  com as mesmas dimensões do card.
- `login/layout.tsx`: `Suspense fallback={null}` em volta de `AuthProvider`
  permanece (fronteira de auth, fora de escopo).

### 8. Pendentes no dashboard
- Novo `(protected)/_components/use-admin-work-titles.ts`:
  `useQuery({ queryKey: adminWorksQueryKey, queryFn: getAdminWorks, select: works → Map<id, title> })`.
  Extraído de `CommentModerationPanel`, que migra para ele (mesma key/cache).
  Não bloqueante.
- Item de `PendingCommentsList` somente leitura: autor, data (`createdAt`,
  mesmo `Intl` pt-BR da moderação), "Trabalho: {título}" com fallback
  `<code>{workId}</code>`, conteúdo; remover linha "ID do comentário".
  Não reutilizar `CommentListItem`.

### 9. Ícones
- Somente `react-icons/lu` (ADR-009); uso mínimo: trigger mobile + ícone
  do estado de erro. Sem ícones na navegação.

### Server/Client
Nenhuma nova fronteira Server/Client.

## Arquivos a tocar

**`components/ui/`**
- Novos (via CLI): `textarea.tsx`, `native-select.tsx`, `skeleton.tsx`.
- Editar: `badge.tsx` (variante `warning` aditiva).

**`app/globals.css`**: token `--warning-text` + `--color-warning-text`.

**`app/(admin)/admin/(protected)/_components/`**
- Editar: `admin-nav-links.ts`, `admin-nav-link.tsx`, `admin-sidebar.tsx`,
  `admin-header.tsx`, `admin-mobile-nav.tsx`, `dashboard-summary.tsx`,
  `pending-comments-list.tsx`.
- Novos: `admin-page-header.tsx`, `admin-states.tsx`,
  `use-admin-work-titles.ts`.

**Páginas `(protected)/`**: `page.tsx`, `trabalhos/page.tsx`,
`trabalhos/novo/page.tsx`, `trabalhos/[slug]/editar/page.tsx`,
`comentarios/page.tsx`.

**`trabalhos/`**: `work-form-fields.tsx`, `admin-work-list.tsx`,
`work-list-item.tsx`, `novo/create-work-form.tsx`,
`[slug]/editar/edit-work-form.tsx`, `_components/work-image-grid.tsx`,
`delete-work-dialog.tsx`, `delete-work-image-dialog.tsx`; novo
`_components/work-status.ts`.

**`comentarios/_components/`**: `comment-status.ts`,
`comment-moderation-panel.tsx`, `edit-comment-dialog.tsx` (remover
`fieldClassName`), `comment-list-item.tsx` apenas se necessário.

**Login**: `app/(admin)/admin/login/page.tsx`.

**Testes**: atualizar apenas por mudanças intencionais de texto/seletor;
novos testes para `isAdminNavItemActive` (incl. `/admin/trabalhos/novo`,
`/admin/trabalhos/x/editar`, `/admin` não casando sub-rotas), variante
`warning`, estados compartilhados e hook de títulos.

(Confirmar caminhos exatos no repositório antes de editar.)

## Fases de implementação

### Fase 1 — Fundação
1. Confirmar em `package.json` que `react-icons` e a CLI shadcn estão
   disponíveis.
2. `npx shadcn add textarea skeleton native-select` — recusar overwrites de
   `button`, `badge`, `input`, `utils`, `globals.css`; revisar diff.
   - **Se `native-select` não existir no registry radix-nova: PARAR e
     reportar blocker ao usuário** (ver "Pontos a confirmar").
3. Variante `warning` em `badge.tsx` (aditiva).
4. Token `--warning-text` / `--color-warning-text` em `globals.css`;
   recalcular contraste (sobre `bg-warning/15` + surface e sobre
   `surface-warm`), registrar em comentário e confirmar distinção do
   cognac `#b56a3b`.
5. Criar `work-status.ts` e atualizar `comment-status.ts`.

### Fase 2 — Shell / navegação
1. `admin-nav-links.ts`: remover "Novo trabalho", adicionar `match`,
   exportar `isAdminNavItemActive`.
2. `AdminNavLink`: usar a função; novos estilos ativo/foco.
3. `AdminSidebar`: marca + sticky.
4. `AdminHeader`: marca `lg:hidden`, account menu à direita em lg+.
5. `AdminMobileNav`: `LuMenu`, manter `SheetTitle`/`aria-label`s.

### Fase 3 — Blocos compartilhados
1. `admin-page-header.tsx` (Server).
2. `admin-states.tsx` (Loading/Error/Empty).
3. `use-admin-work-titles.ts` (extraído de `CommentModerationPanel`).
4. Aplicar `AdminPageHeader` nas 5 páginas protegidas; CTA "Novo trabalho"
   em `/admin/trabalhos`; `gap-8`.

### Fase 4 — Formulários + login
1. `WorkFormFields`: `Textarea` (`min-h-24`), `NativeSelect` com
   `workStatusLabels` (corrige altura do select).
2. Rodapé "Cancelar" + submit nos forms de criar/editar.
3. `EditWorkForm`: loading/error/not-found distintos com estados
   compartilhados.
4. `EditCommentDialog`: `Textarea` (`min-h-32`), remover `fieldClassName`.
5. Login: card centralizado, `h1`, `LoginFormSkeleton` local no fallback.

### Fase 5 — Listagens e dashboard
1. `WorkListItem`: `Badge` via `workStatusBadgeVariants`/`workStatusLabels`;
   "Editar" + "Excluir trabalho" em `sm`.
2. `WorkImageGrid` + `DeleteWorkImageDialog`: "Excluir" destrutivo,
   `aria-label`, título/ação "Excluir imagem".
3. `DeleteWorkDialog`: "Excluir trabalho" + descrição.
4. `AdminWorkList`: estados compartilhados, textos PT-BR.
5. `CommentModerationPanel`: migrar para `useAdminWorkTitles`, estados
   compartilhados (incl. explicação de `HIDDEN`).
6. `DashboardSummary`: `Skeleton` no lugar de "…", textos PT-BR, erro
   inline por card mantido.
7. `PendingCommentsList`: título do trabalho, data pt-BR, remover ID do
   comentário, estados compartilhados.

### Fase 6 — Validação
1. Atualizar testes existentes só por mudanças intencionais de
   texto/seletor; escrever os novos testes listados acima.
2. Cobertura ≥ 80% no código novo/alterado.
3. `lint`, `typecheck`, `build`.
4. Verificação na app rodando em mobile/tablet/desktop para todas as telas
   do escopo. **O usuário normalmente mantém o próprio dev server na porta
   3000: não subir um segundo servidor na 3000 nem encerrar o dele** (usar o
   existente ou outra porta).

## Riscos e cuidados

- `native-select` ausente no registry = blocker.
- CLI shadcn sobrescrevendo primitives customizados (ex.: `outline` com
  `border-muted-foreground/60`, `active:scale-[0.97]` com
  `motion-reduce`) — recusar overwrite e revisar diff.
- Foco:
  - não mover os diálogos (hoisted no nível do painel, com snapshot + `key`);
  - manter `deleteWorkButtonRef` e os refs dos gatilhos de imagem nos
    mesmos botões;
  - manter `h2` com `tabIndex={-1}` e o `sr-only` "do trabalho {title}"
    (espaço `sr-only` fora do `span`).
- Contraste do `warning` sobre `surface-warm`.
- Manter `role="alert"` e `<output>` existentes.
- `Button` `sm` (28px) é aceitável.

## Débitos (fora de escopo — apenas registrar)

- `lucide-react` em `components/layout/mobile-nav.tsx` e
  `components/gallery/gallery-lightbox.tsx`.
- `docs/rules/ui-design-system.md` desatualizado.
- CARSHOP-76 possivelmente obsoleta (decisão do usuário).
- Redirect pós-criação de work para `/admin`.

## Pontos a confirmar com o usuário antes/durante a implementação

- **Blocker condicional**: se `npx shadcn add native-select` falhar por
  ausência no registry radix-nova, interromper a Fase 1 e consultar o
  usuário — não escrever primitive à mão nem criar wrapper paralelo.
- Pendente de sincronização: critério de aceite de idioma de status no
  `spec.md` (ver "Decisões do usuário") deve ser atualizado pelo
  `spec-writer`.

## Segurança

Nenhum segredo, token ou valor real de `.env` é necessário ou citado neste
plano.
