# Plano de implementação — CARSHOP-35

## Status da decisão arquitetural

Decisões do `architect` aprovadas e decisões em aberto da spec respondidas
pelo usuário:

1. **Dashboard `/admin`**: remover `CommentModerationForm` (e seu teste);
   manter `PendingCommentsList` como resumo, com link "Moderar comentários"
   para `/admin/comentarios`.
2. **"Hide" do DoD**: seguir sem ação "Ocultar". O filtro `HIDDEN` é mantido
   com estado vazio explicativo. A falta de caminho de escrita para `HIDDEN`
   fica registrada como **dependência de backend** (item "hide" do DoD
   atendido parcialmente).

Dependências confirmadas no `package.json` (nenhuma nova):
`@tanstack/react-query` 5, `react-hook-form` 7, `@hookform/resolvers` 5,
`zod` 4, `sonner` 2 (`<Toaster>` em `app/layout.tsx`), `axios`, `radix-ui`,
`next` 16 (`searchParams` é `Promise`), `vitest`, Testing Library,
`user-event`. **Nenhum primitivo Shadcn novo**: usar os existentes
(`dialog`, `alert-dialog`, `badge`, `button`, `input`, `label`); `<select>`
e `<textarea>` nativos, estilizados como em `work-form-fields.tsx`.

## Bloqueios / dependências registradas

- **Backend — HIDDEN sem escrita**: `PATCH /admin/comments/{id}` só aceita
  `PENDING`/`APPROVED`. Ocultar de fato exige task no `carshop-backend`. Não
  inventar endpoint. Nenhum bloqueio para iniciar esta task.
- **Título do work**: obtido via `getAdminWorks` (lista completa). Candidato
  futuro a endpoint de backend de títulos; não criar nada agora.

## Arquivos a tocar

Base: `app/(admin)/admin/(protected)/`.

Novos (cada um com teste co-localizado `*.test.ts(x)`):

1. `comentarios/page.tsx`
2. `comentarios/_components/comment-filters.ts`
3. `comentarios/_components/comment-status.ts`
4. `comentarios/_components/comment-status-filter.tsx`
5. `comentarios/_components/comment-moderation-panel.tsx`
6. `comentarios/_components/comment-pagination.tsx` (somente se a
   paginação passar de ~40 linhas; senão inline no painel)
7. `comentarios/_components/comment-list-item.tsx`
8. `comentarios/_components/edit-comment-dialog.tsx`
9. `comentarios/_components/edit-comment-form-values.ts`
10. `comentarios/_components/delete-comment-dialog.tsx`
11. `comentarios/_components/comment-moderation-error.ts`
12. `comentarios/_components/comment-moderation-sync.ts`

Alterados:

- `lib/api/comments.client.ts` (+ `comments.client.test.ts`)
- `_components/admin-nav-links.ts`
- `_components/admin-sidebar.test.tsx` (tamanho 3 → 4) e verificar
  `_components/admin-mobile-nav.test.tsx`
- `page.tsx` do dashboard (+ teste)
- `app/(public)/portfolio/[slug]/comment-form.tsx` (apenas JSDoc, ~linha 39,
  que referencia o arquivo removido)

Removidos:

- `comment-moderation-form.tsx` e seu teste.

Inalterados: `PendingCommentsList`, `DashboardSummary`, `lib/api/http.ts`,
`app/(admin)/admin/actions.ts`.

## Ordem de implementação

1. **Camada de API (`lib/api/comments.client.ts`)**
   - Exportar `adminCommentsBaseQueryKey = ["admin", "comments"] as const`
     e refatorar `adminCommentsQueryKey` para espalhá-la (chaves geradas
     idênticas às atuais).
   - Exportar `EditableCommentStatus = Exclude<CommentStatus, "HIDDEN">`.
   - Ampliar `UpdateCommentPayload` para "ao menos um de"
     `{ authorName: string; content: string; status: EditableCommentStatus }`
     via tipo mapeado `{ [K in keyof F]: Pick<F, K> & Partial<Omit<F, K>> }[keyof F]`.
   - Assinatura de `updateComment` inalterada; tudo via `lib/api/http.ts`,
     sem header manual. Sem `as`/`any`/`ts-ignore`.
   - Testes: chave base, chaves geradas inalteradas, payloads parciais.
   - **Nunca** usar `adminCommentsQueryKey()` para invalidação (3ª posição
     `undefined`, comportamento já confirmado em
     `comments.client.test.ts:141`).

2. **Utilitários puros da feature**
   - `comment-filters.ts`: `CommentFilterStatus = CommentStatus | "ALL"`;
     `parseCommentFilters(searchParams)` (aceita `string | string[] |
     undefined`, usa o primeiro valor; status ausente/inválido → `PENDING`;
     página inválida/`< 1`/não inteira → `1`); `buildCommentsHref({ status,
     page })` (omite `status` quando `PENDING` e `page` quando `1`);
     `toApiStatus(status)` (`ALL` → `undefined`).
   - `comment-status.ts`: rótulos e variantes de `Badge` — `PENDING`
     "Pendente" `outline`; `APPROVED` "Aprovado" `success`; `HIDDEN`
     "Oculto" `secondary`; rótulos de filtro "Pendentes", "Aprovados",
     "Ocultos", "Todos".
   - `comment-moderation-error.ts`: `getCommentModerationErrorMessage(error)`
     (400/401/404/429 com as mensagens definidas pelo `architect`; demais →
     `getApiErrorMessage`) e `isNotFoundError(error)`.
   - `comment-moderation-sync.ts`: `syncAfterCommentMutation(queryClient,
     workId)` com `Promise.allSettled` de `invalidateQueries({ queryKey:
     adminCommentsBaseQueryKey })` + `revalidateCommentsTag(workId)`. Falha
     de sync nunca vira falha da ação. Sem `router.refresh()`.
   - `edit-comment-form-values.ts`: `editCommentSchema` (zod 4;
     `authorName` trim 2–80, `content` trim 3–1000, `status` enum
     `PENDING|APPROVED` opcional; mensagens pt-BR),
     `EditCommentFormValues`, `mapCommentToFormValues`,
     `buildUpdateCommentPayload(original, values)` → `UpdateCommentPayload |
     null` (diff contra o original, não `dirtyFields`; `null` = sem chamada à
     API). Sem refine anti-HTML (nota não bloqueante).

3. **Componentes de apresentação**
   - `comment-status-filter.tsx` (sem `"use client"`): `<nav
     aria-label="Filtrar comentários por status"><ul>` com `Button asChild` +
     `Link` (`scroll={false}`) na ordem Pendentes, Aprovados, Ocultos,
     Todos; ativo com `aria-current="page"` e `variant="default"`, demais
     `outline`, `size="sm"`; `flex flex-wrap gap-2`. Links de filtro omitem
     `page`.
   - `delete-comment-dialog.tsx`: cópia estrutural de
     `DeleteWorkImageDialog` (não generalizar o diálogo compartilhado).
     Props `open`, `onOpenChange`, `authorName`, `excerpt` (80 primeiros
     caracteres), `onConfirm`, `isPending`, `canConfirm`, `error`,
     `onCloseAutoFocus`. Título e ação destrutiva "Excluir comentário" /
     "Excluindo..."; `event.preventDefault()` na ação; cancelar vira "Fechar"
     quando `canConfirm=false`. Descrição cita autor + trecho.

4. **`edit-comment-dialog.tsx`** (`"use client"`)
   - Shadcn `Dialog` controlado; possui form (`useForm` + `zodResolver`) e
     `useMutation`. Props `comment: Comment | null`, `onOpenChange`,
     `onCloseAutoFocus`, `onNotFound`.
   - Campos: `authorName` (`Input`), `content` (`<textarea>` nativo
     `min-h-32`), `status` (`<select>` nativo Pendente/Aprovado) renderizado
     só se o status original for `PENDING`/`APPROVED`. `Label` +
     `aria-invalid` + `aria-describedby`. `reset` a partir do comentário ao
     abrir.
   - Submit "Salvar"/"Salvando..."; controles desabilitados e fechamento
     bloqueado durante pending. Payload `null` → mensagem inline "Nenhuma
     alteração para salvar." sem chamar a API.
   - Erro de API inline `role="alert"`, diálogo permanece aberto. 404:
     esconder "Salvar", cancelar vira "Fechar", chamar `onNotFound`
     (invalidação imediata).
   - Sucesso: `syncAfterCommentMutation`, `toast.success("Comentário
     atualizado.")`, fechar.

5. **`comment-list-item.tsx`** (`"use client"`)
   - `<li>` com borda (`rounded-lg border bg-surface p-4`, como
     `PendingCommentsList`); cabeçalho `flex-wrap` com autor
     `font-semibold`, `Badge` de status com texto, `<time dateTime>`
     formatado via `Intl.DateTimeFormat("pt-BR", { dateStyle: "short",
     timeStyle: "short" })`; linha "Trabalho: {título}" (fallback
     `<code>{workId}</code>`, texto simples, sem link); conteúdo em `<p
     className="whitespace-pre-line break-words">`.
   - Ações em linha própria (`flex flex-wrap gap-2 md:justify-end`), com
     nome acessível incluindo `sr-only` "comentário de {authorName}":
     - "Aprovar" só em `PENDING` → `approveComment(id)` ("Aprovando...");
     - "Voltar para pendente" só em `APPROVED` → `updateComment(id, {
       status: "PENDING" })` ("Atualizando...");
     - "Editar"/"Excluir" chamam `onRequestEdit(comment, triggerEl)` /
       `onRequestDelete(comment, triggerEl)`;
     - `HIDDEN`: apenas Editar/Excluir.
   - `useMutation` por item; pending desabilita só os botões daquele item.
     Sucesso: sync + toast ("Comentário aprovado." / "Comentário voltou para
     pendente."). Erro: `toast.error(mensagem mapeada)`; em 404 também
     invalidar a chave base.

6. **`comment-moderation-panel.tsx`** (`"use client"`, props `status`,
   `page`)
   - Query de comentários: `adminCommentsQueryKey(toApiStatus(status),
     page, 20)` + `getAdminComments({ status, page, limit: 20 })`,
     `COMMENTS_PER_PAGE = 20`, `placeholderData: (prev, prevQuery) =>
     prevQuery?.queryKey[2] === apiStatus ? prev : undefined`.
   - Query de títulos (não bloqueante): `useQuery({ queryKey:
     adminWorksQueryKey, queryFn: getAdminWorks, select: works => new
     Map(works.map(w => [w.id, w.title])) })`.
   - Região de resultados com `<h2 tabIndex={-1} ref>` visível (ex.:
     "Comentários pendentes (N)") como alvo de foco e `aria-busy={isFetching}`;
     `<ul>` de `CommentListItem`.
   - Estados: carregando em `<output>`; erro `<p role="alert">` com
     `getApiErrorMessage`; vazio na página 1 por status (PENDING, APPROVED,
     HIDDEN com texto extra "Ocultar comentários ainda não está disponível
     no painel.", ALL); vazio em página > 1 "Nenhum comentário nesta
     página." mantendo a paginação.
   - Paginação: `<nav aria-label="Paginação de comentários">`,
     Anterior/Próxima como `Button asChild` + `Link` (`scroll={false}`) ou
     `Button disabled`; "Página X de max(1, totalPages)"; exibida só se
     `page > 1 || totalPages > 1`.
   - Guarda snapshots `editTarget`/`deleteTarget` + ref do elemento
     disparador; possui a mutação de exclusão; renderiza **um único**
     `EditCommentDialog` e **um único** `DeleteCommentDialog` no nível do
     painel (nunca dentro do `<li>`). `workId` para sync vem do snapshot.
   - Foco (`onCloseAutoFocus` com `preventDefault`): cancelar/Esc → volta
     ao disparador se `isConnected`; sucesso/404 ou disparador ausente →
     foco no `<h2>`.
   - Exclusão: sucesso → sync + `toast.success("Comentário excluído.")`;
     erro inline no diálogo; 404 → `canConfirm=false` + invalidação
     imediata; 429 permite nova tentativa.

7. **Rota `comentarios/page.tsx`**
   - Server Component assíncrono, `metadata.robots` noindex/nofollow como
     `trabalhos/page.tsx`, sem `<main>` próprio (`AdminShell` fornece).
   - `await searchParams` → `parseCommentFilters`. Renderiza `PageSection
     spacing="compact" container="none"` > `Container variant="page"` com
     `<h1>Comentários</h1>`, `<CommentStatusFilter current={filter.status}
     />` e `<CommentModerationPanel status page />`.
   - Sem `useSearchParams`/`useRouter`/`Suspense`.

8. **Navegação e dashboard**
   - `admin-nav-links.ts`: adicionar `{ href: "/admin/comentarios", label:
     "Comentários" }` como 4º item, após "Novo trabalho"; atualizar o
     comentário do arquivo (CARSHOP-152 + CARSHOP-35).
   - Ajustar `admin-sidebar.test.tsx` (3 → 4) e conferir
     `admin-mobile-nav.test.tsx`.
   - Dashboard `(protected)/page.tsx`: remover import/bloco de
     `CommentModerationForm`; manter `PendingCommentsList`; abaixo dele,
     `Button asChild variant="outline" size="sm"` + `Link`
     "/admin/comentarios" "Moderar comentários". Atualizar teste.
   - Excluir `comment-moderation-form.tsx` e seu teste.
   - Atualizar JSDoc em `app/(public)/portfolio/[slug]/comment-form.tsx`.

9. **Validação final**
   - Rodar a suíte completa (Vitest) com cobertura ≥ 80% no código novo e
     alterado, além de lint e typecheck.
   - Subir o dev server e validar manualmente `/admin/comentarios` (filtros,
     paginação, aprovar, voltar para pendente, editar, excluir, estados
     vazios, foco e teclado) e o dashboard `/admin` antes de reportar
     concluído.

## Testes a cobrir

- `comment-filters`: casos de borda do parser (array, inválido, `0`,
  negativo, decimal, ausente) e `buildCommentsHref`/`toApiStatus`.
- `page`: painel mockado, `searchParams` como `Promise`, h1 e filtro.
- `comment-status-filter`: `aria-current` e hrefs.
- `comment-moderation-panel`: carregando, erro, vazio por status (incluindo
  o texto de HIDDEN), vazio em página > 1, paginação, `ALL` → `status`
  `undefined`, título do work e fallback para `workId`.
- `comment-list-item`: visibilidade das ações por status, payload `{
  status: "PENDING" }`, sucesso com sync + toast, erros 401/404/429, pending
  isolado por item.
- `edit-comment-dialog` / `edit-comment-form-values`: validação, payload
  parcial, sem alteração → sem API, select ausente em HIDDEN, 400/404
  inline.
- `delete-comment-dialog` (+ fluxo no painel): abrir, cancelar sem API,
  pending, sucesso, 404 com `canConfirm=false`, 429 com nova tentativa.
- `comment-moderation-error`: mapeamento por status.
- `comment-moderation-sync`: `allSettled` (falha de um lado não rejeita).
- `comments.client`: chave base, chaves geradas, payloads.
- Navegação (sidebar/mobile) e dashboard (sem `CommentModerationForm`, com
  link).

## Critérios de aceite

- [ ] `/admin/comentarios` lista comentários reais via `GET /admin/comments`.
- [ ] Filtro Pendentes/Aprovados/Ocultos/Todos na URL (`?status=`, `?page=`),
      padrão `PENDING`; HIDDEN com estado vazio explicativo.
- [ ] Aprovar usa `PATCH /admin/comments/{id}/approve`; editar/voltar para
      pendente usam `PATCH /admin/comments/{id}` com payload parcial;
      excluir usa `DELETE /admin/comments/{id}` com confirmação.
- [ ] Nenhuma ação "Ocultar"; limitação registrada como dependência de
      backend.
- [ ] Todas as chamadas via `lib/api/http.ts`, sem header manual.
- [ ] Após mutação: invalidação por `adminCommentsBaseQueryKey` +
      `revalidateCommentsTag(workId)` + toast; erros acessíveis
      (toast/inline `role="alert"`).
- [ ] Cancelar exclusão não chama a API; 404 bloqueia nova tentativa.
- [ ] Item "Comentários" na navegação admin; dashboard sem
      `CommentModerationForm`, com link "Moderar comentários".
- [ ] Cobertura ≥ 80% no código novo/alterado.

## Riscos

- Diálogos dentro do `<li>` desmontariam no refetch — por isso ficam no
  nível do painel, com snapshot do comentário.
- Chave de invalidação errada (`adminCommentsQueryKey()`) deixaria o
  dashboard desatualizado — usar sempre `adminCommentsBaseQueryKey`.
- `placeholderData` incondicional mostraria dados de outro status ao trocar
  filtro — condicionar ao mesmo `apiStatus`.
- `getAdminWorks` busca a lista completa só para títulos (custo aceito;
  candidato a endpoint futuro no backend).
- Formatação de data depende do fuso do cliente (renderização client-only).

## Alternativas rejeitadas (pelo `architect`)

- Filtro em estado local; `useSearchParams` + `router.push`; edição inline;
  tabela; diálogo de exclusão genérico compartilhado.
