# CARSHOP-122 — Documentar e validar contrato da API para consumo pelo frontend

## Metadados da task (Notion Task Tracker)

- **Epic**: Frontend Base
- **Component**: Auth, Works, Comments, Images, Docs
- **Stack**: Fullstack
- **Sprint**: Sprint 3
- **Priority**: High
- **Status**: To Do

Descrição, DoD e Notas Técnicas completas (contrato de API): ver task
`CARSHOP-122` no Notion Task Tracker (não duplicadas aqui além do
necessário para orientar o trabalho — ver seções abaixo).

## Conflito de escopo a sinalizar ao usuário (bloqueante para prosseguir)

O `CLAUDE.md` afirma que o "estado atual real" do projeto é **Vite + React
Router**, e instrui explicitamente a nunca presumir a stack alvo (Next.js)
sem checar `package.json`/`vite.config.ts`. Essa checagem foi feita nesta
sessão e o resultado **contradiz** a premissa do `CLAUDE.md`:

- `package.json`: scripts são `next dev` / `next build` / `next start`;
  dependências incluem `next@^16.3.4`, `react@^19.2.0`, `server-only`; **não
  há** `vite`, `react-router-dom` nem `react-router` em `dependencies`/
  `devDependencies`.
- Não existe `vite.config.ts` no repositório (busca por `vite.config.*`
  retorna apenas ocorrências dentro de `node_modules`).
- A árvore de rotas já é 100% App Router: `app/layout.tsx`,
  `app/(public)/...`, `app/(admin)/admin/...`, `app/sitemap.ts`,
  `app/robots.ts`, cada um com `page.test.tsx`/`*.test.ts` ao lado.
- Já existe infraestrutura própria do Next: `lib/env/client.ts` e
  `lib/env/server.ts` (validação Zod de env vars, com `server-only`
  importado em `server.ts`), e uma convenção documentada em
  `.env.example` (prefixo `NEXT_PUBLIC_` vs. server-only).
- Isso já havia sido observado e registrado como "Observação lateral" na
  spec `CARSHOP-116` (não corrigida no fluxo até agora).

**Isto não é uma migração proposta por este agente** — é a constatação de
que a premissa "Vite + React Router" do `CLAUDE.md`/fluxo de execução está
desatualizada frente ao código real. Como as Notas Técnicas do Notion já
assumem "o frontend Next.js" (cookies, CSRF, `credentials`), o contrato
descrito é compatível com o estado real do repositório, mas o
`CLAUDE.md` deveria ser corrigido por decisão do usuário — sinalizado aqui,
não resolvido unilateralmente. Esta spec segue com base no **código real**
(Next.js App Router), por ser a fonte de verdade mais alta segundo a
própria hierarquia do `CLAUDE.md` ("repositório de código atual" >
decisões arquiteturais > Notion > Obsidian).

## Estado real do repositório (verificado nesta sessão)

- **Camada HTTP já existente, com convenção documentada (ADR-001,
  referenciada em comentário de código)**:
  - `lib/api/http.ts`: instância única do Axios para chamadas client-side
    (`axios.create({ baseURL: clientEnv.NEXT_PUBLIC_API_URL })`), **sem**
    `withCredentials: true` configurado ainda. Comentário no arquivo diz
    explicitamente: nenhuma feature deve instanciar Axios diretamente nem
    usar `fetch` para o mesmo propósito no cliente.
  - `lib/api/works.ts`: camada de acesso a dados para `Work`
    (`getWorks`, `getWorkBySlug`, `getCoverImage`) usando `fetch` nativo do
    Next em Server Components (import `"server-only"` no topo) — **não**
    usa `lib/api/http.ts`. Já reflete o shape real de `Work`/`WorkImage`
    descrito nas Notas Técnicas desta task (`id`, `slug`, `title`,
    `description`, `category`, `tags`, `images`, `status`, `createdAt`,
    `updatedAt`, `deletedAt`).
  - Nenhum client/service para `Comment`, `WorkImage` (upload/remove) ou
    `Auth` existe ainda — precisam ser criados do zero.
- **Env vars**: `NEXT_PUBLIC_API_URL` já existe e é validada via Zod em
  `lib/env/client.ts` (`z.string().url()`) e reexposta em
  `lib/env/server.ts` (`serverEnv.apiUrl`). `.env.example` documenta a
  convenção `NEXT_PUBLIC_` (client bundle) vs. sem prefixo (server-only).
  O `.env` local do usuário aponta para valores de desenvolvimento local
  (não a URL de produção do backend) — nenhum valor sensível foi lido ou
  reproduzido aqui, conforme
  [docs/rules/spec-security.md](../../docs/rules/spec-security.md).
- **Auth**: não existe nenhum código de autenticação no repositório —
  nenhum contexto/provider, hook, rota de login, nem storage de token.
  `docs/rules/auth.md` já estabelece regras gerais (armazenamento seguro,
  não expor tokens em URL/log, decisão conjunta com `routing.md` para
  proteção de rotas autenticadas) mas não há implementação prévia para
  reaproveitar.
- `docs/rules/routing.md` reafirma a mesma premissa desatualizada ("app
  real ainda usa Vite + React Router") — mesmo conflito documentado acima,
  não resolvido nesta spec.

## Objetivo

Fazer o frontend consumir a API real do backend em produção
(`https://carshop-backend-htag.onrender.com`), cobrindo: apontamento de
`NEXT_PUBLIC_API_URL` para a URL de produção (quando aplicável ao
ambiente), fluxo de autenticação completo (login, refresh, logout, sessão)
respeitando cookies HttpOnly + padrão CSRF double-submit, consumo de
works/comentários públicos, e — na área admin — works/imagens/comentários
protegidos. Documentar/validar o contrato real de API contra o código
existente (`lib/api/works.ts` já parcialmente alinhado).

## Escopo (derivado da Descrição/DoD)

1. **Configuração de ambiente**: garantir que `NEXT_PUBLIC_API_URL` possa
   apontar para `https://carshop-backend-htag.onrender.com` nos ambientes
   apropriados (não sobrescrever `.env` local de desenvolvimento do
   usuário sem necessidade — decisão de qual arquivo/ambiente recebe a URL
   de produção é do `architect`/`developer`, ex.: `.env.production`,
   variável de ambiente da plataforma de deploy, etc.).
2. **Cliente HTTP com credenciais**: configurar `lib/api/http.ts`
   (Axios, client-side) com `withCredentials: true`; para chamadas `fetch`
   server-side que precisem de cookies (ex.: `GET /auth/session` em
   Server Components/Route protection), usar `credentials: 'include'`
   explicitamente onde aplicável — decisão exata de quais chamadas são
   client vs. server é do `architect`.
3. **Fluxo de autenticação** (login, refresh automático em 401, logout,
   sessão): novo módulo(s) — local exato (`lib/api/auth.ts` +
   contexto/provider de estado) é decisão do `architect`/`developer`, não
   presumida aqui. Deve seguir as regras de `docs/rules/auth.md`
   (`accessToken` em memória, nunca `localStorage`/`sessionStorage`) e o
   contrato do Notion (`POST /auth/login`, `POST /auth/refresh`,
   `POST /auth/logout`, `GET /auth/session`, header `X-CSRF-Token` lido do
   cookie `csrf_token`).
4. **Consumo de works/comments públicos**: estender a camada de dados
   existente (`lib/api/works.ts` ou novo módulo de comments) para
   `GET /works/:workId/comments` (lista aprovados) e
   `POST /works/:workId/comments` (cria comentário público, fica
   `PENDING`).
5. **Área admin protegida**: consumo de `POST /works`,
   `DELETE /admin/works/:workId`, `POST /admin/works/:workId/images`
   (multipart, 5MB, JPEG/PNG/WebP), `DELETE /admin/works/:workId/images/
   :imageId`, `PATCH /admin/comments/:commentId/approve`,
   `PATCH /admin/comments/:commentId`, `DELETE /admin/comments/:commentId`.
   Rotas admin já existem como stub (`app/(admin)/admin/...`) — integração
   real é o que falta.
6. **Testes**: cobertura das novas camadas de dados/fluxos (mock da
   camada HTTP; não chamadas reais ao backend de produção em testes
   automatizados).
7. **Fora do escopo deste repositório**: configurar `CORS_ORIGIN` no
   backend — apenas sinalizar como dependência externa (flag ao
   usuário/operador de infra).

## Fora de escopo

- Qualquer alteração no repositório do backend (`carshop-backend`),
  incluindo `CORS_ORIGIN`.
- Migração da stack Vite→Next.js ou qualquer decisão arquitetural de
  migração — não se aplica aqui, pois o código já é Next.js (ver seção de
  conflito acima); nenhuma migração é proposta ou necessária para esta
  task.
- Correção do texto do `CLAUDE.md`/`docs/rules/routing.md` sobre "estado
  atual" — sinalizado ao usuário, não corrigido nesta task.
- Uso de Swagger em produção como fonte de verdade (está desabilitado);
  contrato desta spec/task é a fonte de verdade.

## Riscos/Dependências

- **CORS**: chamadas à API de produção falharão até o backend configurar
  `CORS_ORIGIN` com a origem exata do frontend — dependência externa, fora
  deste repositório, deve ser sinalizada e não bloqueia o desenvolvimento
  local contra um backend local/staging equivalente.
- **Cold start do Render**: backend em produção pode ter latência de cold
  start — relevante para timeout/UX de loading, não é um bug do frontend.
- **Expiração de `accessToken`**: fluxo de refresh automático em 401 (uma
  tentativa, depois redireciona ao login) precisa ser implementado de
  forma centralizada (ex.: interceptor Axios) para não duplicar lógica em
  cada chamada — decisão de onde/como é do `architect`.
- **Server vs. Client Components para dados autenticados**: como
  `accessToken` vive em memória (client-side) e cookies HttpOnly não são
  legíveis por JS, o `architect` precisa decidir a estratégia de sessão
  para páginas admin (Server Component não tem acesso ao `accessToken` em
  memória do cliente) — isso é uma decisão arquitetural não trivial, não
  resolvida nesta spec.

## Critérios de aceite (derivados do DoD do Notion)

- [ ] Login mantém sessão via `accessToken` em memória + cookies HttpOnly
      (`refresh_token`, `csrf_token`), sem uso de
      `localStorage`/`sessionStorage`.
- [ ] Renovação de sessão via `POST /auth/refresh` com `X-CSRF-Token`
      correto.
- [ ] Logout limpa cookies e revoga sessão no servidor.
- [ ] Listagem/exibição de works publicados e comentários aprovados
      (público).
- [ ] Criação de comentário público (`PENDING` até aprovação).
- [ ] Rotas admin autenticadas: criar/listar/deletar works, upload/remover
      imagens, moderar comentários — tudo contra a API real de produção,
      sem erros de CORS/CSRF (respeitada a dependência externa de
      `CORS_ORIGIN` descrita acima).
- [ ] Todas as chamadas usam `withCredentials: true` (Axios) ou
      `credentials: 'include'` (fetch), conforme aplicável.
- [ ] Build/lint/typecheck passam; testes cobrindo os novos fluxos de
      dados/auth (mockados, sem depender de rede real em CI).

## Arquivos prováveis a tocar

- `lib/api/http.ts` (adicionar `withCredentials: true`)
- `lib/api/works.ts` (estender ou criar `lib/api/comments.ts` para
  comments públicos/admin)
- Novo(s) módulo(s) de auth (ex. `lib/api/auth.ts`, contexto/provider —
  local exato é decisão do `architect`/`developer`)
- Novo(s) módulo(s) de imagens admin (upload/remove)
- `app/(admin)/admin/**` (integração real, substituindo stubs)
- `.env.example` / documentação de ambiente (se a estratégia de apontar
  para produção exigir nova variável ou arquivo)
- Testes correspondentes a cada novo módulo (`*.test.ts`/`*.test.tsx`)

## Classificação de tamanho: NON-TRIVIAL

Justificativa: a task toca múltiplas áreas do sistema (auth, works,
comments, imagens, configuração de ambiente) em vários arquivos novos e
existentes, exige decisões arquiteturais não triviais e ainda não tomadas
(estratégia de sessão/autenticação em Server vs. Client Components,
onde/como centralizar o refresh automático em 401, onde armazenar o
`accessToken` em memória de forma compartilhada pela árvore de
componentes, local exato dos novos módulos de API) e tem uma dependência
externa relevante (CORS no backend) e um conflito de premissa de stack já
sinalizado acima. Não se enquadra em TRIVIAL (não é mudança pontual de
baixo risco) nem em SMALL (múltiplos arquivos/áreas e decisões
arquiteturais obrigatórias). **Plano obrigatório via `plan-writer`.**

## Próximos agentes necessários

1. **Sinalizar ao usuário**, antes de prosseguir: (a) o conflito entre a
   premissa "Vite + React Router" do `CLAUDE.md`/`docs/rules/routing.md` e
   o código real (Next.js App Router); (b) a dependência externa de
   `CORS_ORIGIN` no backend, fora deste repositório.
2. `knowledge-reader` — consultar Obsidian (`CarShop/Architecture`,
   `CarShop/ADRs`) por `ADR-001` (Axios) e por decisões prévias sobre
   estratégia de autenticação/sessão em Next.js App Router;
   `CarShop/Studies` como não vinculante.
3. `architect` — decidir: estratégia de sessão para Server vs. Client
   Components em rotas admin autenticadas; local/estrutura dos novos
   módulos de API (auth, comments, images); mecanismo de
   interceptor/retry para refresh automático em 401; proteção de rotas
   admin (`docs/rules/routing.md` + `docs/rules/auth.md`).
4. `plan-writer` — persistir `plan.md` (task NON-TRIVIAL), detalhando
   sequência de implementação, arquivos exatos e casos de teste.
