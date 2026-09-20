# CARSHOP-30 — Proteger área admin no Next.js

## Metadados da task (Notion Task Tracker)

- **Epic**: Frontend Admin
- **Component**: Auth
- **Stack**: Frontend
- **Sprint**: Sprint 5
- **Priority**: High
- **Status**: To Do
- **Tipo**: Task

Descrição, DoD e Notas Técnicas completas: ver task `CARSHOP-30` no Notion
Task Tracker — não duplicadas aqui além do necessário para orientar o
trabalho.

## Conflito de escopo a sinalizar ao usuário (bloqueante para prosseguir)

A Descrição/DoD de `CARSHOP-30` pede a implementação da proteção de
navegação de `/admin` no Next.js App Router (redirect para `/admin/login`
quando não há sessão válida, integrado à estratégia real de sessão/JWT do
backend, sem usar `ProtectedRoute`/`Navigate` do React Router legado).

A verificação do repositório real nesta sessão mostra que **esse escopo já
está implementado e testado**, com dupla camada de proteção:

1. **Camada 1 — `proxy.ts`** (matcher `/admin/:path*`): checagem barata da
   existência do cookie `refresh_token` na request; redireciona para
   `/admin/login` se ausente; não intercepta `/admin/login` (evita loop de
   redirect); não chama o backend.
2. **Camada 2 — `app/(admin)/admin/(protected)/layout.tsx`** (Server
   Component, `export const dynamic = "force-dynamic"`): chama
   `getSession()` (`lib/api/auth.server.ts`, `GET /auth/session` via
   `fetch` nativo repassando o header `Cookie` da request, `cache:
   "no-store"`); se `null`, chama `redirect("/admin/login")`; se sucesso,
   renderiza `AuthProvider` com `initialUser` e os `children`.

`app/(admin)/admin/login/` vive fora do grupo `(protected)`, evitando que a
própria rota de login exija sessão válida para ser renderizada.

Nenhum uso de `ProtectedRoute`/`Navigate` do React Router foi encontrado —
consistente com a migração já concluída para Next.js App Router.

Testes existentes cobrindo o DoD:

- `proxy.test.ts`: redirect sem `refresh_token`, passthrough com o cookie
  presente, não interceptação de `/admin/login`.
- `app/(admin)/admin/(protected)/layout.test.tsx`: redirect para
  `/admin/login` tanto no cenário "nunca autenticado" quanto no cenário
  "sessão expirada entre requests" (ambos via `getSession()` retornando
  `null`), e render normal (`AuthProvider` + `children`) quando a sessão é
  válida.

Não existe spec prévia para `CARSHOP-30` no repositório
(`specs/CARSHOP-30/` não existia antes desta sessão).

Essa constatação é análoga à já registrada em `specs/CARSHOP-29/spec.md`
para a task irmã (persistência de sessão): o Status `To Do` de `CARSHOP-30`
no Notion parece desatualizado frente ao estado real do repositório —
entregue por `CARSHOP-122` (spec em `specs/CARSHOP-122/spec.md`,
NON-TRIVIAL, com plano) e auditado/reforçado por `CARSHOP-138` (spec em
`specs/CARSHOP-138/spec.md`). Conforme a hierarquia de fontes de verdade do
`CLAUDE.md` ("repositório de código atual" é mais autoritativo que o
Notion), sinalizo o conflito ao usuário em vez de resolvê-lo unilateralmente
— decisão sobre status de task é responsabilidade do `task-manager` mediante
validação explícita do usuário, não deste agente.

**Pergunta a decidir com o usuário antes de acionar `developer`:** a
intenção de `CARSHOP-30` é (a) apenas atualizar o status da task no Notion
para refletir que o trabalho já foi entregue por `CARSHOP-122`/`CARSHOP-138`
(sem código novo), ou (b) existe uma lacuna específica não coberta pelo
código atual que ainda precisa ser implementada? Se (b), é necessário
apontar exatamente qual parte do DoD não está satisfeita, pois a auditoria
desta sessão não encontrou nenhuma.

## Escopo (condicional à resposta acima)

Assumindo a hipótese (b) — se alguma lacuna pontual for identificada — o
escopo seria um ajuste incremental localizado sobre os arquivos já listados
acima (`proxy.ts`, `app/(admin)/admin/(protected)/layout.tsx`,
`lib/api/auth.server.ts`), não uma reimplementação da arquitetura de
proteção de rota (já decidida e em produção no código).

## Fora de escopo

- Reescrever a dupla camada de proteção de rota já implementada
  (`proxy.ts` + `(protected)/layout.tsx` + `auth.server.ts#getSession()`).
- Qualquer alteração na autorização real das operações administrativas —
  permanece responsabilidade exclusiva do backend (`carshop-backend`), fora
  deste repositório.
- Decidir/alterar o status da task no Notion — cabe ao `task-manager`
  mediante validação explícita do usuário.

## Esclarecimento sobre o DoD (natureza da proteção)

Importante deixar explícito, para qualquer implementação futura sob esta
task: a proteção descrita aqui (proxy + layout Server Component) é **apenas
UX/experiência de navegação** no frontend — evita que um usuário sem sessão
válida veja telas administrativas renderizadas. Ela **não constitui
autorização real**. Toda rota/operação sensível deve continuar validada e
autorizada pelo backend independentemente do que o frontend esconde ou
redireciona, conforme já registrado no Risco/Atenção da Descrição da task no
Notion.

## Riscos/Dependências

- **Contrato real do backend não confirmado nesta sessão**: a Descrição da
  task pede integração com "a estratégia real de sessão/JWT do backend". O
  código atual assume o contrato de `GET /auth/session` (retorna `{ user }`
  ou falha) e do cookie `refresh_token`, herdado de `CARSHOP-122`. A
  instrução do usuário pedia conferir `docs/api-contract.md` do repositório
  remoto `carshop-backend` para validar esse contrato — esse repositório
  não é acessível a partir deste ambiente/sessão. **Registrado como
  dependência/bloqueio**: antes de qualquer alteração de código sob esta
  task, confirmar o contrato real de `/auth/session` e dos cookies de
  sessão junto ao `carshop-backend` (código-fonte ou Swagger/OpenAPI), em
  vez de assumir que o contrato herdado de `CARSHOP-122` permanece válido.
- Atributos de cookie (`Secure`/`SameSite`/`HttpOnly`/`path`) são definidos
  pelo backend, fora deste repositório — já registrado como dependência
  externa em `specs/CARSHOP-138/spec.md`.

## Classificação de tamanho: TRIVIAL (condicionada à confirmação do usuário)

Justificativa: não há trabalho de implementação identificado nesta sessão —
o DoD de `CARSHOP-30` já está satisfeito pelo código atual (dupla camada de
proteção de rota, sem uso de padrões legados do React Router), entregue por
`CARSHOP-122` e auditado por `CARSHOP-138`, com cobertura de teste para os
cenários relevantes (sem sessão, sessão expirada, sessão válida). A única
ação concreta restante é uma decisão administrativa (status da task) fora
do escopo de código, ou, caso o usuário/backend aponte uma lacuna
específica (ex.: contrato de sessão desatualizado), um ajuste pontual
localizado (reclassificar então como SMALL, não NON-TRIVIAL, já que não há
decisão arquitetural em aberto — a arquitetura de proteção de rota já está
definida). Não aciono `plan-writer` neste momento.

## Próximos agentes necessários

1. **Sinalizar ao usuário** (feito acima) o conflito entre o Status
   `To Do` de `CARSHOP-30` e o estado real do repositório, e a
   inacessibilidade de `docs/api-contract.md` do `carshop-backend` nesta
   sessão, antes de prosseguir para qualquer implementação.
2. `knowledge-reader` — opcional: confirmar no Obsidian se há alguma nota
   específica associada a `CARSHOP-30` (distinta de `CARSHOP-122`/
   `CARSHOP-138`) que aponte uma lacuna não coberta pelo código, e se há
   registro do contrato real de `/auth/session` do backend.
3. `architect` — não necessário: nenhuma decisão arquitetural nova está em
   aberto; a arquitetura existente já cobre o DoD desta task.
4. `plan-writer` — não necessário (task TRIVIAL/sem lacuna identificada).
