# CARSHOP-35 — Página /admin/comentarios (moderação)

## Metadados da task (Notion Task Tracker)

- **Epic**: Frontend Admin
- **Component**: Comments
- **Sprint**: Sprint 6
- **Priority**: Medium
- **Points**: 3
- **Status**: To Do
- **Figma**: não há

Descrição, DoD e Notas Técnicas completas: ver task `CARSHOP-35` no Notion.
Aqui ficam só os pontos necessários para orientar o trabalho.

## Objetivo

Criar a rota admin `/admin/comentarios` para moderar comentários reais.
Comentários chegam como `PENDING` (via `POST /works/{workId}/comments`) e
precisam ser listados com filtro por status, aprovados, editados e
excluídos (com confirmação), tudo via endpoints admin autenticados.

## Contrato confirmado (`carshop-backend/docs/api-contract.md`, seção "Admin — Comments")

O contrato real prevalece sobre o Notion. Todas as rotas exigem
`Authorization: Bearer <ACCESS_TOKEN>`.

| Método | Rota | Entrada | Sucesso | Erros |
| --- | --- | --- | --- | --- |
| GET | `/admin/comments` | query `status?` (`PENDING`\|`APPROVED`\|`HIDDEN`), `page?` (padrão 1), `limit?` (padrão 20, máx. 100) | `200` `{ items: Comment[], page, limit, total, totalPages }`, ordenado por `createdAt` desc | 400, 401, 429 |
| PATCH | `/admin/comments/{commentId}/approve` | sem body | `200` `CommentResponse` | 401, 404, 429 |
| PATCH | `/admin/comments/{commentId}` | body com ao menos 1 prop: `authorName` (2–80), `content` (3–1000), `status` (`PENDING`\|`APPROVED`) | `200` `CommentResponse` | 400, 401, 404, 429 |
| DELETE | `/admin/comments/{commentId}` | — | `200` `{ success: true }` | 401, 404, 429 |

`Comment` = `{ id, workId, authorName, content, status, createdAt, updatedAt }`
(já tipado em `lib/api/comments.ts`).

**Não usar** `GET /works/{workId}/comments` (público, só `APPROVED`).

## Divergências registradas (código/contrato prevalecem sobre o Notion)

1. **"Ocultar" (HIDDEN) é impossível pelo contrato.** A Description/DoD
   falam em "editar/ocultar", mas `PATCH /admin/comments/{id}` só aceita
   `status` `PENDING` ou `APPROVED`, e nenhum caminho de escrita coloca um
   comentário em `HIDDEN`. `GET /admin/comments?status=HIDDEN` é aceito,
   porém sempre retorna `items: []`.
   Tratamento nesta task:
   - manter o filtro `HIDDEN` na UI (valor válido de query), exibindo um
     estado vazio claro;
   - **não** oferecer ação "Ocultar";
   - a edição de status permitida é `APPROVED` <-> `PENDING` (ex.:
     "Voltar para pendente" num comentário aprovado);
   - registrar como **dependência de backend**: para ocultar de fato, é
     preciso uma task no `carshop-backend` que aceite `HIDDEN` no PATCH
     (ou um endpoint dedicado). Não inventar endpoint.
   O item do DoD "Approve, edit/hide and delete" fica atendido
   parcialmente em "hide", por limitação do contrato.
2. **Autenticação: Bearer (Notion/contrato) vs. mecanismo real.** Não há
   conflito. O client `lib/api/http.ts` já injeta `Authorization: Bearer`
   (token em memória), `X-CSRF-Token` em PATCH/DELETE, usa
   `withCredentials` via o proxy `/api-proxy` e faz um único
   `POST /auth/refresh` em 401 antes de chamar `onAuthFailure`
   (redireciona ao login). Todas as funções de `lib/api/comments.client.ts`
   já usam esse client. **Proibido adicionar header manual** ou criar outra
   instância Axios (ADR-001).
3. **Tipo `UpdateCommentPayload` incompleto.** Em `lib/api/comments.client.ts`
   ele é `{ content: string }`, mas o contrato aceita `authorName`,
   `content` e `status` (`PENDING`|`APPROVED`), todos opcionais com ao
   menos um presente. O tipo precisa ser ampliado, restringindo `status` a
   `"PENDING" | "APPROVED"` (não `CommentStatus`, que inclui `HIDDEN`). A
   assinatura continua compatível com o uso atual em
   `CommentModerationForm`.
4. **Moderação duplicada no dashboard.** `/admin` (CARSHOP-152) já tem
   `PendingCommentsList` (só leitura, PENDING) e `CommentModerationForm`
   (ações por ID digitado à mão, excluir **sem confirmação**, o que
   contraria o risco "confirmar ações destrutivas"). A task não diz o que
   fazer com eles. **Decidido pelo usuário** (ver "Decisões do usuário").
5. **Navegação admin.** `_components/admin-nav-links.ts` tem um comentário
   dizendo para não criar seções sem decisão de arquitetura. Esta task
   pede a rota explicitamente, então adicionar o item "Comentários" →
   `/admin/comentarios` é esperado, mas a posição/rótulo fica com o
   `architect`.

## Estado real do repositório

- **Rota `/admin/comentarios`**: não existe. Não há link na navegação.
- **Camada de dados pronta** (`lib/api/comments.client.ts`):
  `getAdminComments({ status, page, limit })`, `approveComment(id)`,
  `updateComment(id, payload)`, `deleteComment(id)` e
  `adminCommentsQueryKey(status?, page?, limit?)` →
  `["admin", "comments", status, { page, limit }?]`. Tipos em
  `lib/api/comments.ts` (`Comment`, `CommentStatus`).
- **Consumidores atuais da mesma query**: `DashboardSummary` e
  `PendingCommentsList` usam `adminCommentsQueryKey("PENDING", 1, 20)`.
  O cache é compartilhado pelo `QueryClientProvider` global
  (`app/providers.tsx`).
- **Invalidação do cache público**: `revalidateCommentsTag(workId)` em
  `app/(admin)/admin/actions.ts` (`updateTag(work-comments-{workId})`).
  Deve ser chamada após qualquer mutação, pois aprovar/voltar para
  pendente/editar/excluir altera a lista pública de `APPROVED`.
- **Padrões reaproveitáveis**:
  - página admin: `trabalhos/page.tsx` (Server Component, `PageSection` +
    `Container variant="page"`, `metadata.robots` noindex, sem `<main>`
    próprio pois `AdminShell` já fornece);
  - diálogo de confirmação: `trabalhos/_components/delete-work-dialog.tsx`
    e `delete-work-image-dialog.tsx` (Shadcn `AlertDialog`, componente de
    apresentação com `open`, `onConfirm`, `isPending`, `error`,
    `onCloseAutoFocus`);
  - mapeamento de erro por status local à feature:
    `trabalhos/_components/delete-work-image-error.ts`;
  - lista paginada: `_components/pending-comments-list.tsx`;
  - feedback de sucesso: `sonner` (`<Toaster>` em `app/layout.tsx`), já
    usado em `create-work-form.tsx` e `edit-work-form.tsx`.
- **Primitivos Shadcn existentes** (`components/ui/`): `alert-dialog`,
  `badge`, `button`, `card`, `dialog`, `input`, `label`, `sheet`. Não há
  `select`, `tabs` nem `textarea`. Se o `architect` quiser algum, deve ser
  adicionado via Shadcn CLI (`docs/rules/architecture.md`).
- React Hook Form + Zod estão instalados (`docs/rules/forms.md`).

## Escopo

1. **Rota** `app/(admin)/admin/(protected)/comentarios/page.tsx`
   (Server Component com `metadata.robots` noindex, no padrão de
   `trabalhos/page.tsx`), com componentes específicos em
   `comentarios/_components/`.
2. **Item de navegação** "Comentários" em `admin-nav-links.ts`
   (sidebar e mobile nav já o consomem).
3. **Listagem real** via `getAdminComments` (Client Component com
   `useQuery`), mostrando autor, conteúdo, status (ex.: `Badge`), data de
   criação e identificação do work (`workId`, pois o endpoint não traz o
   título; resolver título via `getAdminWorks` é opcional e fica com o
   `architect`). Estados de carregando, erro (`role="alert"`) e vazio.
4. **Filtro por status**: Todos (sem `status`), `PENDING`, `APPROVED`,
   `HIDDEN`. Padrão sugerido: `PENDING` (fila de moderação); decisão final
   do `architect`. Trocar o filtro volta para a página 1. `HIDDEN` mostra
   estado vazio com texto explicando que não há comentários ocultos.
   Persistir o filtro na URL (`?status=`) é opcional (decisão do
   `architect`).
5. **Paginação** com `page`/`limit` (padrão 20), no padrão de
   `PendingCommentsList`.
6. **Aprovar**: ação visível só para comentários `PENDING`, via
   `approveComment(id)`.
7. **Editar** (diálogo ou inline, decisão do `architect`): `authorName`,
   `content` e `status` (`PENDING`|`APPROVED`), validados com Zod nas
   mesmas regras do contrato (2–80, 3–1000), enviando só os campos
   alterados (ao menos um). Pode incluir a ação rápida "Voltar para
   pendente" em comentários aprovados.
8. **Excluir com confirmação** via `AlertDialog` no padrão de
   `DeleteWorkDialog` (botão desabilitado + "Excluindo..." durante o
   DELETE; cancelar não chama a API).
9. **Após cada mutação bem-sucedida**:
   - invalidar **todas** as queries de comentários admin (todos os status
     e páginas, incluindo as do dashboard). Atenção: o prefixo gerado por
     `adminCommentsQueryKey()` contém `undefined` na 3ª posição e não
     casa com as chaves de status específico; usar `["admin", "comments"]`
     como prefixo (ou expor um helper de chave base em
     `comments.client.ts`);
   - chamar `revalidateCommentsTag(comment.workId)`;
   - feedback de sucesso (`toast.success`, `sonner`).
10. **Feedback de erro** por status, com mapeamento local à feature no
    padrão de `delete-work-image-error.ts`:
    - `400`: dados inválidos (edição);
    - `401`: sessão expirada (o interceptor já tenta refresh/redirect);
    - `404`: comentário não encontrado; refazer a listagem e, no diálogo
      de exclusão, não permitir nova tentativa (padrão `canConfirm` da
      CARSHOP-34);
    - `429`: muitas tentativas, aguardar;
    - demais: `getApiErrorMessage`.
    Estado de pendência/erro por ação/comentário, sem vazar de um item
    para outro.
11. **Ampliar `UpdateCommentPayload`** (divergência 3), com testes em
    `lib/api/comments.client.test.ts`.
12. **Testes** (Vitest + Testing Library): página, listagem, filtro
    (incluindo `HIDDEN` vazio), paginação, aprovar, editar (validação +
    payload parcial), excluir (abrir/cancelar/confirmar), invalidação e
    `revalidateCommentsTag`, feedback 400/401/404/429 e atualização do
    item de navegação (`admin-nav-links`/sidebar). Cobertura mínima de 80%
    no código novo ou alterado.

## Fora de escopo

- Ação "Ocultar"/status `HIDDEN` na escrita (divergência 1, dependência de
  backend).
- Qualquer alteração no backend ou endpoint novo.
- Uso de `GET /works/{workId}/comments` para moderação.
- Ações em lote (aprovar/excluir vários de uma vez).
- Mudanças em `lib/api/http.ts` ou no fluxo de autenticação.

## Decisões do usuário (antes "Decisões em aberto" — resolvidas)

1. **Destino de `CommentModerationForm` e `PendingCommentsList` no
   dashboard `/admin`** (divergência 4). **Decidido: opção A.** Remover
   `CommentModerationForm` do dashboard (e seu teste), pois a nova página o
   substitui e ele exclui sem confirmação. Manter `PendingCommentsList`
   como resumo, com um link "Moderar comentários" para
   `/admin/comentarios`.
   Opções descartadas: B (manter o dashboard como está) e C (remover ambos,
   deixando só o card de contagem).
2. **"Hide" do DoD** (divergência 1). **Decidido: seguir sem ação
   "Ocultar".** O filtro `HIDDEN` é mantido na UI com estado vazio
   explicativo, e a falta de caminho de escrita para `HIDDEN` fica
   registrada como **dependência de backend**. O item "hide" do DoD fica
   atendido parcialmente.

## Riscos e dependências

- **CARSHOP-136 (backend `GET /admin/comments`)**: já disponível e
  consumido no front (CARSHOP-152).
- **CARSHOP-29 (sessão admin)**: implementada.
- **Dependência de backend para HIDDEN**: sem ela, o filtro `HIDDEN`
  sempre fica vazio.
- **Título do work**: o endpoint só retorna `workId`; exibir o título
  exige cruzar com `getAdminWorks` (custo extra, opcional).
- **Invalidação por prefixo** (item 9): se feita errado, o dashboard fica
  com contagem de pendentes desatualizada.

## Critérios de aceite (derivados do DoD)

- [ ] `/admin/comentarios` lista comentários reais via `GET /admin/comments`.
- [ ] Filtro Todos/PENDING/APPROVED/HIDDEN funciona (HIDDEN com estado
      vazio explicativo).
- [ ] Aprovar usa `PATCH /admin/comments/{id}/approve`; editar usa
      `PATCH /admin/comments/{id}` (autor/conteúdo/status
      `PENDING`|`APPROVED`); excluir usa `DELETE /admin/comments/{id}`.
- [ ] Nenhuma ação "Ocultar"; limitação registrada como dependência de
      backend.
- [ ] Todas as chamadas passam por `lib/api/http.ts` (Bearer + CSRF +
      refresh automáticos), sem header manual.
- [ ] Após mutação, a UI atualiza (invalidação de todas as queries de
      comentários admin + `revalidateCommentsTag`) e mostra feedback de
      sucesso/erro acessível.
- [ ] Exclusão exige confirmação; cancelar não chama a API.
- [ ] Item "Comentários" na navegação admin.
- [ ] Cobertura mínima de 80% no código novo/alterado.

## Arquivos prováveis

- Novo: `app/(admin)/admin/(protected)/comentarios/page.tsx` (+ teste).
- Novo: `app/(admin)/admin/(protected)/comentarios/_components/`
  (lista/filtro, item, diálogo de edição, diálogo de exclusão, mapeamento
  de erros; nomes e divisão ficam com o `architect`) + testes.
- Alterado: `lib/api/comments.client.ts` (+ teste): `UpdateCommentPayload`
  e, se útil, chave base de invalidação.
- Alterado: `app/(admin)/admin/(protected)/_components/admin-nav-links.ts`
  (+ testes de sidebar/mobile nav, se afetados).
- Alterado (decisão 1, opção A): `app/(admin)/admin/(protected)/page.tsx`
  (+ teste); removido: `comment-moderation-form.tsx` (+ teste).
  `_components/pending-comments-list.tsx` permanece inalterado.

## Classificação de tamanho: NON-TRIVIAL (`plan.md` obrigatório)

Justificativa: nova rota admin com vários componentes (lista, filtro,
paginação, edição com formulário validado, confirmação de exclusão),
alteração da camada de API, alteração da navegação e decisão estrutural
sobre a moderação já existente no dashboard. São ~8–12 arquivos em 3
áreas (`comentarios/`, `_components/` do admin, `lib/api/`), com
decisões de fronteira de componentes e de estratégia de cache.

## Próximos agentes

1. **Usuário**: decisões 1 e 2 confirmadas (ver "Decisões do usuário").
2. `architect`: estrutura da rota e fronteiras Server/Client, UI do filtro
   (botões/tabs/select), edição em diálogo vs. inline, estratégia de
   invalidação por prefixo, filtro na URL ou não, exibição do work, e
   posição do item na navegação (Admin UI pode usar padrões
   convencionais, `docs/design/`).
3. `plan-writer`: persistir `specs/CARSHOP-35/plan.md`.
4. `developer`, `tester` e `reviewer`, no fluxo normal.

O `knowledge-reader` é opcional: contrato e padrões já foram confirmados
no repositório. Só vale se houver notas no Obsidian sobre moderação ou
sobre o status `HIDDEN`.
