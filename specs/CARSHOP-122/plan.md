# CARSHOP-122 — Plano de implementação

Baseado nas decisões do `architect` (ver spec.md §"Próximos agentes
necessários" e decisão registrada nesta sessão). Este plano não introduz
nenhuma decisão arquitetural nova — apenas ordena a execução.

## Pré-condições / pontos já sinalizados ao usuário (não bloqueiam o `developer`)

- **Conflito de premissa "Vite + React Router" no `CLAUDE.md`/
  `docs/rules/routing.md`**: já sinalizado pelo `spec-writer`. O código
  real é Next.js App Router (fonte de verdade mais alta). O `developer`
  segue este plano com base no código real; não corrige o texto do
  `CLAUDE.md`/`routing.md` como parte desta task.
- **`CORS_ORIGIN` no backend de produção**: dependência externa
  (`carshop-backend`, fora deste repositório). `withCredentials: true` +
  cookies cross-site vão falhar contra produção até essa configuração
  existir no backend. Não bloqueia desenvolvimento/testes locais contra um
  backend local/staging equivalente, e não bloqueia a implementação desta
  task — apenas o smoke test final contra produção. Se ao final da
  implementação o smoke test contra produção falhar por CORS, isso deve
  ser reportado ao usuário como pendência externa, não como bug do
  frontend.
- Nenhum outro blocker foi levantado pelo `architect`.

## Ordem de implementação

A ordem respeita dependências: a camada HTTP (interceptors) precisa
existir antes de qualquer client que dependa dela; `auth.server`/
`auth.client` precisam existir antes do layout/login que os consomem;
`AuthProvider` precisa existir antes de ser montado no layout.

### 1. `lib/api/http.ts` (edit) — fundação

- Adicionar `withCredentials: true` na instância Axios existente.
- Adicionar interceptor de request: anexa `Authorization: Bearer
  <token>` lendo o token via `getAccessToken()` (módulo-level, não React
  state).
- Adicionar interceptor de request: para métodos mutantes
  (`POST`/`PATCH`/`PUT`/`DELETE`), anexa `X-CSRF-Token` lido do cookie
  `csrf_token` via `document.cookie` (client-only — não executa em SSR).
- Adicionar interceptor de response: em `401`, tenta **uma única vez**
  `POST /auth/refresh` e repete a request original; exclui explicitamente
  `/auth/login` e `/auth/refresh` desse retry (evitar loop). Em falha do
  refresh, dispara o callback registrado via `onAuthFailure()`.
- Exportar: `getAccessToken()`, `setAccessToken(token: string | null)`,
  `onAuthFailure(callback: () => void)`.
- Manter o comentário/convenção ADR-001 existente no topo do arquivo.

**Teste (`tester`)**: `lib/api/http.test.ts` — interceptor anexa
`Authorization` quando há token e omite quando não há; interceptor anexa
`X-CSRF-Token` apenas em métodos mutantes; fluxo de refresh-then-retry em
`401` (mock de `auth.client#refresh`); `/auth/login` e `/auth/refresh` não
entram em retry; `onAuthFailure` é chamado quando o refresh falha. Mockar
Axios/backend — nenhuma chamada de rede real.

### 2. `lib/api/auth.server.ts` (novo) — server-only

- `import "server-only"` no topo, seguindo a convenção de `works.ts`.
- `getSession()`: `fetch` nativo para `GET /auth/session`, repassando
  manualmente os cookies da request recebida via `next/headers cookies()`
  (`Cookie` header), `cache: 'no-store'`. Usado exclusivamente por
  `app/(admin)/admin/layout.tsx`.
- Tipar o shape de `Session`/`User` conforme o contrato descrito na spec
  (Notas Técnicas do Notion) — sem inventar campos além do necessário
  para `AuthProvider`.

**Teste (`tester`)**: `lib/api/auth.server.test.ts` — repassa cookies
corretamente, trata resposta de sessão válida e resposta de
erro/401 (retorna estado que o layout interpreta como "não autenticado").
Mockar `fetch`.

### 3. `lib/api/auth.client.ts` (novo) — Axios

- `login(email, password)`, `logout()`, `refresh()` (também usado
  internamente pelo interceptor de `http.ts` no passo 1 — atenção à
  ordem de dependência circular: `http.ts` importa `refresh` deste
  arquivo, e este arquivo usa a instância `http` de `http.ts`; se causar
  import cycle, mover `refresh()` para dentro de `http.ts` ou usar
  import dinâmico — decisão de detalhe de implementação do `developer`,
  não arquitetural).
- `getSession()` (variante client, Axios) — usada pelo `AuthProvider` no
  passo 4 para re-bootstrap ao montar no cliente.
- Em `login()` bem-sucedido, apenas retorna os dados (token/usuário); quem
  grava o token via `setAccessToken()` é o chamador (`AuthProvider`/
  `LoginForm`), não este módulo.

**Teste (`tester`)**: `lib/api/auth.client.test.ts` — `login`/`logout`/
`refresh`/`getSession` chamam os endpoints corretos com os payloads
corretos; tratamento do formato de erro da API (conforme contrato da
spec) propagado para o chamador. Mockar Axios.

### 4. `lib/auth/AuthProvider.tsx` (novo) — Client Component

- `"use client"`. Contexto React com `{ user, isAuthenticated, login,
  logout }`.
- Recebe `initialUser` via prop (populada pelo layout com o resultado de
  `auth.server#getSession()`).
- `login()`: chama `auth.client#login()`, grava o token retornado via
  `setAccessToken()` (de `http.ts`), atualiza `user` no estado React.
- `logout()`: chama `auth.client#logout()`, `setAccessToken(null)`, limpa
  `user`.
- Registra callback em `onAuthFailure()` (de `http.ts`) para limpar sessão
  local e redirecionar para `/admin/login` quando o refresh automático do
  interceptor falhar.
- Ao montar no cliente, pode re-chamar `auth.client#getSession()` para
  garantir consistência (per decisão do `architect`).
- Exporta hook `useAuth()`.

**Teste (`tester`)**: `lib/auth/AuthProvider.test.tsx` — estado inicial a
partir de `initialUser`; `login`/`logout` atualizam `isAuthenticated`;
callback de `onAuthFailure` limpa estado. Usar Testing Library, mockar
`auth.client.ts` e `http.ts`.

### 5. `middleware.ts` (novo, raiz do projeto) — camada 1 de proteção

- `matcher: ['/admin/:path*']`, excluindo `/admin/login`.
- Checagem barata: existência do cookie `refresh_token` na request. Se
  ausente, `redirect` para `/admin/login`. **Não** chama o backend aqui.

**Teste (`tester`)**: `middleware.test.ts` — request sem `refresh_token`
redireciona para `/admin/login`; request com `refresh_token` presente
segue adiante; `/admin/login` não é interceptado.

### 6. `app/(admin)/admin/layout.tsx` (edit) — camada 2 de proteção

- Tornar `async` Server Component.
- Chamar `auth.server#getSession()` (passo 2), repassando cookies da
  request.
- Em falha (sessão inválida/expirada), `redirect('/admin/login')`.
- Em sucesso, renderizar `<AuthProvider initialUser={session.user}>
  {children}</AuthProvider>`.
- Adicionar `export const dynamic = 'force-dynamic'`.
- Manter `robots: { index: false }` já existente.

**Teste (`tester`)**: `app/(admin)/admin/layout.test.tsx` — redireciona
quando `getSession()` falha; renderiza `AuthProvider` com `initialUser`
quando `getSession()` tem sucesso. Mockar `auth.server.ts`.

### 7. `app/(admin)/admin/login/page.tsx` (novo) — única rota excluída do middleware

- Client Component `LoginForm`: `react-hook-form` + `@hookform/resolvers`
  (zod), schema de validação de `email`/`password`.
- No submit, chama `auth.client#login()` diretamente (Axios) — **não** é
  Server Action.
- Em sucesso, grava o token via o `login()` exposto por `useAuth()`
  (`AuthProvider`, passo 4) e redireciona para o painel admin.
- Trata e exibe o formato de erro da API (conforme contrato da spec) em
  caso de credenciais inválidas.

**Teste (`tester`)**: `app/(admin)/admin/login/page.test.tsx` — validação
de formulário (campos obrigatórios/formato), submit bem-sucedido chama
`login()` e redireciona, submit com erro exibe mensagem sem travar a UI.
Mockar `auth.client.ts`.

### 8. `lib/api/works.client.ts` (novo) — Axios, mutações admin

- `createWork(payload)`, `deleteWork(workId)`, usando a instância `http`
  (interceptors do passo 1 se aplicam automaticamente).

**Teste (`tester`)**: `lib/api/works.client.test.ts` — payload/endpoint
corretos para create/delete; erros da API propagados no formato do
contrato. Mockar Axios.

### 9. `lib/api/images.client.ts` (novo) — Axios, mutações admin

- `uploadWorkImage(workId, formData)` (multipart, respeita limite de 5MB
  e tipos `JPEG/PNG/WebP` conforme validado no formulário/UI antes do
  envio — validação client-side, backend é a fonte de verdade final),
  `deleteWorkImage(workId, imageId)`.

**Teste (`tester`)**: `lib/api/images.client.test.ts` — `FormData`
montado corretamente para upload; delete chama o endpoint correto; erro
de tamanho/tipo tratado no formato de erro do contrato.

### 10. `lib/api/comments.ts` (novo) — server-only, leitura pública

- `import "server-only"`.
- `getWorkComments(workId)`: `fetch` para `GET /works/:workId/comments`
  (lista aprovados), `next: { revalidate: ~300, tags:
  ['work-comments-' + workId] }`, mesmo padrão de `works.ts`.

**Teste (`tester`)**: `lib/api/comments.test.ts` — chamada ao endpoint
correto, tags/revalidate corretos, erro de resposta tratado. Mockar
`fetch`.

### 11. `lib/api/comments.client.ts` (novo) — Axios

- `createComment(workId, payload)` — público, resulta em comentário
  `PENDING`.
- `approveComment(commentId)`, `updateComment(commentId, payload)`,
  `deleteComment(commentId)` — admin.

**Teste (`tester`)**: `lib/api/comments.client.test.ts` — payload/endpoint
corretos para cada operação; formato de erro do contrato propagado.

### 12. `app/(admin)/admin/actions.ts` (novo) — Server Actions, só invalidação de cache

- `"use server"`.
- `revalidateWorksTag()`: `revalidateTag('works')`.
- `revalidateCommentsTag(workId)`: `revalidateTag('work-comments-' +
  workId)`.
- **Nunca** chamam o backend Express diretamente — só invalidam o Next
  Data Cache.

**Teste (`tester`)**: `app/(admin)/admin/actions.test.ts` — cada action
chama `revalidateTag` com a chave correta.

### 13. Integração das telas admin (create/delete work, upload/delete imagem, moderar comentário)

- Componentes Client existentes/novos em `app/(admin)/admin/**` (stubs já
  existem conforme spec) passam a chamar os clients Axios dos passos
  8–11.
- Após sucesso da mutação Axios, chamar a Server Action correspondente
  (`revalidateWorksTag()`/`revalidateCommentsTag(workId)`) do passo 12.
- Qualquer listagem admin que precise de dado sempre-atual (ex.: fila de
  moderação de comentários) usa `fetch` server-side com `cache:
  'no-store'` + `export const dynamic = 'force-dynamic'` na própria
  page/route — nunca o caminho ISR de `works.ts`.

**Teste (`tester`)**: testes de componente para cada fluxo (mutação
Axios mockada + Server Action mockada, ordem de chamadas — mutação antes
de invalidação; UI reflete loading/erro conforme formato de erro do
contrato).

### 14. Configuração de ambiente (fora do código de app)

- Não sobrescrever o `.env` local do usuário.
- Apontamento de `NEXT_PUBLIC_API_URL` para produção
  (`https://carshop-backend-htag.onrender.com`) é decisão de
  deploy-time/ambiente (ex. `.env.production` ou variável da plataforma de
  deploy), fora do escopo desta implementação de código — apenas
  documentar em `.env.example`/nota se necessário, sem valores reais.

## Mapeamento de DoD → cobertura de teste (para o `tester`)

| Critério de aceite (spec.md) | Onde é implementado | Onde é testado |
|---|---|---|
| Login mantém sessão via `accessToken` em memória + cookies HttpOnly | `http.ts` (passo 1), `AuthProvider.tsx` (4), `login/page.tsx` (7) | `http.test.ts`, `AuthProvider.test.tsx`, `login/page.test.tsx` |
| Renovação via `POST /auth/refresh` com `X-CSRF-Token` | `http.ts` (1), `auth.client.ts` (3) | `http.test.ts` (interceptor 401), `auth.client.test.ts` |
| Logout limpa cookies e revoga sessão no servidor | `auth.client.ts` (3), `AuthProvider.tsx` (4) | `auth.client.test.ts`, `AuthProvider.test.tsx` |
| Listagem de works publicados e comentários aprovados (público) | `works.ts` (existente, sem mudança), `comments.ts` (10) | `lib/api/comments.test.ts` |
| Criação de comentário público (`PENDING`) | `comments.client.ts` (11) | `comments.client.test.ts` |
| Rotas admin: criar/deletar works, upload/remover imagens, moderar comentários | `works.client.ts` (8), `images.client.ts` (9), `comments.client.ts` (11), telas admin (13) | testes de cada client + testes de componente das telas |
| `withCredentials`/`credentials: 'include'` em todas as chamadas | `http.ts` (1), `auth.server.ts`/`comments.ts` (repasse manual de cookies, 2 e 10) | `http.test.ts`, `auth.server.test.ts`, `comments.test.ts` |
| Proteção de rotas admin (duas camadas) | `middleware.ts` (5), `admin/layout.tsx` (6) | `middleware.test.ts`, `admin/layout.test.tsx` |
| Build/lint/typecheck passam; testes cobrindo os fluxos, sem rede real em CI | todos os passos acima | suíte completa mockada (Axios/`fetch` mockados em todos os testes listados) |

## Observações finais

- Nenhuma chamada real ao backend de produção em testes automatizados —
  todos os testes listados mockam `axios`/`fetch`.
- O smoke test manual contra produção (`https://carshop-backend-htag.onrender.com`)
  depende de `CORS_ORIGIN` estar configurado no backend (dependência
  externa já sinalizada) — se falhar por CORS, reportar como pendência
  externa, não reabrir este plano.
- Nenhum valor de `.env` real deve ser incluído em código, comentários,
  specs ou PRs desta task (`docs/rules/spec-security.md`).
