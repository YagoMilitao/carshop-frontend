# CARSHOP-29 — Implementar persistência segura da sessão admin no Frontend

## Metadados da task (Notion Task Tracker)

- **Epic**: Frontend Admin
- **Component**: Auth
- **Stack**: Frontend
- **Sprint**: Sprint 5
- **Priority**: High
- **Status**: To Do
- **Tipo**: Task

Descrição, DoD e Notas Técnicas completas: ver task `CARSHOP-29` no Notion
Task Tracker (URL: https://app.notion.com/2de765c3f0d480858b3cfb946bd9600a) —
não duplicadas aqui além do necessário para orientar o trabalho.

## Conflito de escopo a sinalizar ao usuário (bloqueante para prosseguir)

A Descrição/DoD de `CARSHOP-29` pede a implementação, do zero, de uma
arquitetura de sessão admin: access token em memória (não em
`localStorage`), reaproveitamento de cookie HttpOnly/CSRF do backend,
login/logout, refresh, e centralização do estado de autenticação no
frontend.

A verificação do repositório real nesta sessão mostra que **esse escopo já
está implementado e testado**, entregue pela task `CARSHOP-122` (spec em
`specs/CARSHOP-122/spec.md`, classificada NON-TRIVIAL, com plano em
`specs/CARSHOP-122/plan.md`) e posteriormente auditado/reforçado por
`CARSHOP-138` (spec em `specs/CARSHOP-138/spec.md`). Não existe spec prévia
para `CARSHOP-29` no repositório (`specs/CARSHOP-29/` não existia antes
desta sessão).

Evidência concreta no código atual:

- `lib/api/http.ts`: instância única do Axios (`withCredentials: true`);
  `accessToken` mantido em variável module-level (memória), nunca em
  `localStorage`/`sessionStorage`; interceptor de request injeta
  `Authorization: Bearer` e `X-CSRF-Token` (lido de `document.cookie`,
  cookie `csrf_token`) em métodos mutantes; interceptor de response faz
  refresh automático single-flight em 401, com retry único e exclusão de
  `/auth/login`/`/auth/refresh` do retry, disparando `onAuthFailure` em
  falha definitiva.
- `lib/api/auth.client.ts`: `login()`, `refresh()`, `logout()`,
  `getSession()` contra `POST /auth/login`, `POST /auth/refresh`,
  `POST /auth/logout`, `GET /auth/session`.
- `lib/api/auth.server.ts`: `getSession()` via `fetch` nativo (Server
  Component), repassando o header `Cookie` da request recebida,
  `cache: "no-store"`.
- `lib/auth/AuthProvider.tsx`: contexto React que centraliza `user`,
  `isAuthenticated`, `login`, `logout`; recebe `initialUser` do Server
  Component (`admin/layout.tsx`), mantém `accessToken` via
  `setAccessToken`/`getAccessToken` de `http.ts`; registra callback de
  `onAuthFailure` para redirecionar a `/admin/login`.
- `app/(admin)/admin/login/page.tsx`: formulário de login (RHF + Zod)
  consumindo `useAuth().login`.
- `app/(admin)/admin/(protected)/layout.tsx` + `proxy.ts`: dupla camada de
  proteção de rota (checagem de cookie `refresh_token` no proxy + validação
  de sessão real no Server Component via `auth.server.ts#getSession()`).
- Testes existentes cobrindo esses fluxos: `lib/api/http.test.ts`,
  `lib/api/auth.client.test.ts`, `lib/api/auth.server.test.ts`,
  `lib/auth/AuthProvider.test.tsx`, `app/(admin)/admin/login/page.test.tsx`,
  `app/(admin)/admin/(protected)/layout.test.tsx`.

Isso **não é uma decisão desta spec** — é a constatação de que o Status
`To Do` de `CARSHOP-29` no Notion está desatualizado frente ao estado real
do repositório. Conforme a hierarquia de fontes de verdade do `CLAUDE.md`
("repositório de código atual" é mais autoritativo que o Notion), sinalizo
o conflito ao usuário em vez de resolvê-lo unilateralmente (ex.: marcar a
task como concluída) — isso é responsabilidade do `task-manager` mediante
validação explícita do usuário, não deste agente.

**Pergunta a decidir com o usuário antes de acionar `developer`:** a
intenção de `CARSHOP-29` é (a) apenas atualizar o status da task no Notion
para refletir que o trabalho já foi entregue por `CARSHOP-122`/`CARSHOP-138`
(sem código novo), ou (b) existe uma lacuna específica não coberta pelo
código atual que ainda precisa ser implementada? Se (b), é necessário
apontar exatamente qual parte do DoD não está satisfeita, pois a auditoria
desta sessão não encontrou nenhuma.

## Escopo (condicional à resposta acima)

Assumindo a hipótese (b) — alguma lacuna pontual for identificada — o
escopo seria auditoria/ajuste incremental sobre os arquivos já listados
acima, no mesmo padrão descrito em `specs/CARSHOP-138/spec.md`, não uma
reimplementação da arquitetura (que já está decidida e em produção no
código).

## Fora de escopo

- Reescrever a arquitetura de autenticação já implementada por
  `CARSHOP-122` (accessToken em memória, cookies HttpOnly, CSRF
  double-submit, refresh interceptor, dupla camada de proteção de rota).
- Qualquer alteração no repositório `carshop-backend`.
- Decidir/alterar o status da task no Notion — cabe ao `task-manager`
  mediante validação explícita do usuário.

## Riscos/Dependências

- Confirmação do contrato real de `/auth/login`, `/auth/refresh`,
  `/auth/logout`, `/auth/session` contra `carshop-backend` (fora deste
  repositório) não foi refeita nesta sessão — o código existente já assume
  esse contrato (herdado de `CARSHOP-122`); se o contrato de backend mudou
  desde então, isso é uma dependência a confirmar antes de qualquer ajuste.
- Atributos de cookie (`Secure`/`SameSite`/`HttpOnly`/`path`) são definidos
  pelo backend, fora deste repositório — já registrado como dependência
  externa em `specs/CARSHOP-138/spec.md`.

## Classificação de tamanho: TRIVIAL (condicionada à confirmação do usuário)

Justificativa: não há trabalho de implementação identificado nesta sessão
— o DoD de `CARSHOP-29` já está satisfeito pelo código atual, entregue por
`CARSHOP-122` e auditado por `CARSHOP-138`. A única ação concreta restante é
uma decisão administrativa (status da task) fora do escopo de código, ou,
caso o usuário aponte uma lacuna específica, uma mudança pontual localizada
(reclassificar então como SMALL, não NON-TRIVIAL, dado que não há decisão
arquitetural em aberto). Não aciono `plan-writer` neste momento.

## Próximos agentes necessários

1. **Sinalizar ao usuário** (feito acima) o conflito entre o Status
   `To Do` de `CARSHOP-29` e o estado real do repositório antes de
   prosseguir para qualquer implementação.
2. `knowledge-reader` — opcional: confirmar no Obsidian se há alguma nota
   específica associada a `CARSHOP-29` (distinta de `CARSHOP-122`/
   `CARSHOP-138`) que aponte uma lacuna não coberta pelo código.
3. `architect` — não necessário: nenhuma decisão arquitetural nova está em
   aberto; a arquitetura existente já cobre o DoD desta task.
4. `plan-writer` — não necessário (task TRIVIAL/sem lacuna identificada).
