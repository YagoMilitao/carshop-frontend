# CARSHOP-138 — Auditar e endurecer autenticação/autorização admin (end-to-end)

## Metadados da task (Notion Task Tracker)

- **Epic**: Autenticação Admin
- **Component**: Auth, Admin UI
- **Stack**: Fullstack
- **Sprint**: Sprint 5
- **Priority**: High
- **Status**: To Do
- **Points**: 5

Descrição, DoD e Notas Técnicas completas: ver task `CARSHOP-138` no Notion
Task Tracker (não duplicadas aqui além do necessário para orientar o
trabalho — ver seções abaixo). Complementa `CARSHOP-2`, `CARSHOP-29`,
`CARSHOP-30` e `CARSHOP-126`.

## Escopo deste repositório

Este é o repositório `carshop-frontend` (Next.js App Router + TypeScript
estrito). O backend (`carshop-backend`) é um repositório separado, sem
checkout local neste ambiente — não invento endpoints/contratos. O contrato
HTTP real e autoritativo fica em `carshop-backend/docs/api-contract.md`
(fora deste repositório); onde algo precisar ser confirmado contra esse
contrato e não puder ser verificado aqui, registro como dependência/bloqueio
abaixo em vez de assumir.

## Estado real do repositório (verificado nesta sessão)

A auditoria encontrou uma implementação de autenticação **já madura**,
entregue majoritariamente por `CARSHOP-122` (ver `specs/CARSHOP-122/spec.md`),
com cobertura de teste relevante já existente. Nenhuma implementação nova de
"proteção de /admin" a partir do zero é necessária — o trabalho desta task é
auditoria/hardening/preenchimento de lacunas sobre o que já existe:

- **Proteção em duas camadas de `/admin/*`** (defesa em profundidade):
  - Camada 1 — `proxy.ts` (matcher `/admin/:path*`): checagem barata de
    presença do cookie `refresh_token`, redireciona para `/admin/login` se
    ausente; não chama o backend. Coberto por `proxy.test.ts`.
  - Camada 2 — `app/(admin)/admin/(protected)/layout.tsx` (Server
    Component, `dynamic = "force-dynamic"`): chama
    `lib/api/auth.server.ts#getSession()` (que repassa o header `Cookie` da
    request via `fetch` nativo, `cache: "no-store"`) contra
    `GET /auth/session` no backend; se `null`, `redirect("/admin/login")`.
    Esta é a fronteira server-side apropriada exigida pelo DoD — o backend
    permanece a autoridade final de autorização (a camada 1 nunca decide
    autorização, só existência de cookie). Coberto por
    `app/(admin)/admin/(protected)/layout.test.tsx`.
  - `/admin/login` fica fora do grupo protegido (evita loop de redirect).
- **`accessToken` em memória** (module-level em `lib/api/http.ts`), nunca em
  `localStorage`/`sessionStorage` — confirmado por busca no código (únicas
  ocorrências de `localStorage`/`sessionStorage` são comentários
  explicando o que **não** fazer).
- **`refresh_token`**: tratado no frontend exclusivamente como cookie
  HttpOnly (nunca lido via `document.cookie`/JS) — a checagem em `proxy.ts`
  usa `request.cookies.has(...)`, que funciona com cookies HttpOnly do lado
  do servidor; o atributo `HttpOnly` em si é definido pelo backend
  (`Set-Cookie`), fora deste repositório.
- **CSRF (double-submit)**: `lib/api/http.ts` lê `csrf_token` de
  `document.cookie` e anexa `X-CSRF-Token` em métodos mutantes
  (POST/PUT/PATCH/DELETE); omitido em SSR (sem `document`) e quando o cookie
  não existe. Coberto extensivamente por `lib/api/http.test.ts`.
- **Refresh automático em 401**: interceptor de resposta do Axios faz
  single-flight refresh + retry (uma tentativa, exclui `/auth/login` e
  `/auth/refresh` de retry para evitar loop); em falha do refresh, limpa
  `accessToken` e dispara `onAuthFailure` (registrado pelo `AuthProvider`,
  que redireciona para `/admin/login`). Já cobre o cenário de **sessão
  expirada** no client-side.
- **`withCredentials: true`** já configurado na instância única do Axios.
- **Testes de acesso não autenticado**: `proxy.test.ts` e
  `app/(admin)/admin/(protected)/layout.test.tsx` cobrem esse cenário
  diretamente.
- **Testes de sessão expirada**: cobertos indiretamente — `auth.server.test.ts`
  testa `getSession()` retornando `null` quando a resposta não é `ok`
  (sessão ausente **ou** expirada, mesmo código de tratamento) e
  `http.test.ts` testa o fluxo de refresh falho → `onAuthFailure`. Não há um
  teste que force explicitamente uma distinção semântica entre "nunca
  autenticado" vs. "sessão que expirou entre requests" — ver lacuna abaixo.

## O que o DoD desta task pede além do que já existe (lacunas/verificações pendentes)

1. **Cookies com `Secure`/`SameSite`/`path` apropriados ao ambiente de
   deploy** — atributo de `Set-Cookie`, decidido e implementado
   **pelo backend**, fora deste repositório. O frontend não define esses
   atributos. Ação neste repositório: confirmar contra
   `carshop-backend/docs/api-contract.md` que o contrato documentado inclui
   esses atributos por ambiente; se não puder ser confirmado nesta sessão
   (sem checkout do backend), **registrar como dependência externa/bloqueio
   a validar com o time de backend**, não assumir conformidade.
2. **CSRF obrigatório "onde aplicável"** — implementado para todas as
   chamadas Axios mutantes via `http.ts`. Auditar se existe alguma chamada
   mutante fora dessa instância única (violaria também a convenção ADR-001
   de instância única do Axios) — checagem rápida de grep por
   `axios.create`/`fetch(` com métodos mutantes fora de `lib/api/http.ts` e
   `lib/api/auth.server.ts` (que só faz GET).
3. **Cobertura de teste explícita para "sessão expirada"** como cenário
   distinto de "nunca autenticado", conforme o DoD exige ambos os cenários
   nomeadamente. Ação: avaliar se vale adicionar um teste dedicado (ex.:
   `getSession()` chamado com um `refresh_token` presente mas que o backend
   responde 401/expirado) para deixar essa distinção explícita na suíte,
   mesmo que o código de produção já trate os dois casos identicamente.
4. **Endpoints administrativos protegidos no backend** — fora deste
   repositório; não auditável sem acesso ao código do backend. Registrar
   como dependência/confirmação externa junto ao time de backend ou ao
   `carshop-backend/docs/api-contract.md`, não assumir.
5. **Revisão de qualquer rota/Server Action admin nova** desde `CARSHOP-122`
   que não passe pelas duas camadas de proteção existentes (ex.: novas
   rotas adicionadas fora de `app/(admin)/admin/(protected)/`) — checagem
   de auditoria a fazer durante a implementação, não uma mudança de
   arquitetura.

## Conflito/observação a sinalizar ao usuário

Nenhum conflito de escopo entre Descrição/DoD e o estado real do repositório
foi identificado: a arquitetura de autenticação (Server Component como
fronteira de autorização, `accessToken` em memória, cookies HttpOnly,
CSRF double-submit) já implementada é compatível com o DoD desta task.
A única situação a destacar (não é um conflito, é um limite de escopo) é
que parte do DoD (atributos de cookie `Secure/SameSite/path`, proteção de
endpoints admin no backend) pertence ao repositório `carshop-backend`, sem
checkout local — essas linhas do DoD só podem ser **auditadas por
documentação/contrato**, não implementadas ou verificadas em código neste
repositório.

## Fora de escopo

- Qualquer alteração no repositório `carshop-backend`.
- Reescrever a arquitetura de autenticação já decidida em `CARSHOP-122`
  (duas camadas de proteção, accessToken em memória, refresh interceptor)
  — esta task é auditoria/hardening incremental, não uma nova decisão
  arquitetural.
- Invenção de endpoints ou atributos de cookie não confirmáveis contra o
  contrato real.

## Critérios de aceite (derivados do DoD do Notion, mapeados ao estado atual)

- [x] Acesso a `/admin` validado na fronteira server-side do Next.js —
      já implementado (`proxy.ts` + `ProtectedAdminLayout`); auditar por
      rotas novas não cobertas.
- [ ] Endpoints administrativos protegidos no backend — depende de
      confirmação externa (backend), registrar como dependência.
- [x] Ausência/expiração de sessão não expõe conteúdo admin — já
      implementado via `redirect` no Server Component.
- [ ] `refresh_token` permanece HttpOnly — depende de confirmação do
      `Set-Cookie` real do backend (fora deste repositório); o frontend
      nunca lê esse cookie via JS, o que é consistente com HttpOnly.
- [ ] Cookies usam `Secure`/`SameSite`/`path` apropriados por ambiente —
      depende de confirmação do backend/contrato.
- [x] CSRF obrigatório onde aplicável — já implementado em `http.ts`.
- [x] Nenhum token sensível em `localStorage` — confirmado, nenhuma
      ocorrência de uso real.
- [ ] Testes cobrem acesso não autenticado (já cobrem) e sessão expirada
      (cobertos indiretamente — avaliar se adicionar teste explícito
      dedicado a esse cenário nomeado).

## Arquivos prováveis a tocar

- `lib/api/auth.server.ts` / `lib/api/auth.server.test.ts` (possível teste
  adicional de sessão expirada, se decidido necessário)
- `proxy.ts` / `proxy.test.ts` (auditoria; alteração apenas se lacuna for
  encontrada)
- `app/(admin)/admin/(protected)/layout.tsx` / `layout.test.tsx` (auditoria)
- `lib/api/http.ts` / `lib/api/http.test.ts` (auditoria de CSRF/refresh;
  alteração apenas se lacuna for encontrada)
- Nenhuma alteração esperada em `carshop-backend` (fora deste repositório)

## Classificação de tamanho: SMALL

Justificativa: a arquitetura de autenticação/autorização já está
implementada e testada (entregue por `CARSHOP-122`), sem decisão
arquitetural pendente. O trabalho desta task é essencialmente auditoria
pontual sobre um número limitado de arquivos já identificados
(`proxy.ts`, `lib/api/auth.server.ts`, `lib/api/http.ts`,
`app/(admin)/admin/(protected)/layout.tsx` e seus testes), com possíveis
ajustes pequenos e localizados (ex.: um teste adicional de sessão
expirada) e dependências externas a registrar (backend), não a
implementar. Não é TRIVIAL porque envolve mais de um arquivo/área e uma
auditoria de segurança completa (DoD com 8 itens, cruzando frontend e
contrato de backend), mas também não atinge o critério de NON-TRIVIAL
porque não há decisão de arquitetura em aberto nem múltiplas áreas novas a
construir — plano é opcional.

## Próximos agentes necessários

1. `knowledge-reader` — opcional, recomendado: consultar Obsidian
   (`CarShop/ADRs`, `CarShop/Architecture`) por eventuais decisões prévias
   ligadas a `CARSHOP-2`, `CARSHOP-29`, `CARSHOP-30`, `CARSHOP-126`
   relevantes a esta auditoria (ex.: decisões já tomadas sobre
   `SameSite`/ambientes de deploy, se documentadas).
2. `architect` — não obrigatório: nenhuma decisão arquitetural nova está
   em aberto; a arquitetura existente (CARSHOP-122) já cobre o DoD desta
   task. Acionar apenas se a auditoria do `developer` encontrar uma lacuna
   que exija decisão estrutural nova (ex.: rota admin nova fora das
   camadas de proteção existentes).
3. `plan-writer` — não obrigatório (task SMALL); pode ser usado
   opcionalmente se o `developer` preferir registrar a lista de
   verificação da auditoria como plano antes de tocar código.
