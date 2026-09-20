# CARSHOP-28 — Criar página /admin/login (UI + validação)

## Referência da tarefa

- Notion: `CARSHOP-28` — "Criar página /admin/login (UI + validação)".
- Status consultado: `To Do`, Priority Medium, Sprint 5, Stack Frontend,
  Component Auth, Epic Frontend Admin, Type Task.
- Descrição, DoD e Notas Técnicas completas: ver task `CARSHOP-28` no Notion
  Task Tracker (não duplicadas aqui além do necessário — resumo abaixo).

Resumo do pedido original: criar `app/admin/login/page.tsx` no App Router,
com formulário de email/senha, validação via React Hook Form + Zod (quando a
stack estiver instalada), chamada ao endpoint real de login do backend,
tratamento de loading/erro/sucesso, sem depender de React Router, sem
revelar existência de email específico e sem logar senha/token.

## Conflito de escopo a sinalizar ao usuário (bloqueante para prosseguir)

**A página pedida por esta task já existe, implementada e testada no
repositório**, aparentemente como parte do escopo mais amplo já entregue
pela `CARSHOP-122` ("Documentar e validar contrato da API para consumo pelo
frontend", cuja spec já documentava a integração de auth incluindo
`/admin/login`):

- `app/(admin)/admin/login/page.tsx` — Client Component (`"use client"`)
  com formulário de email/senha usando `react-hook-form` +
  `@hookform/resolvers/zod` + `zod` (schema `loginSchema` com mensagens em
  pt-BR), estados de loading (`isSubmitting` desabilita o botão e troca o
  texto para "Entrando..."), erro (mensagem genérica via
  `getApiErrorMessage`, exibida em `role="alert"`) e sucesso (`router.push
  ("/admin")` após `login()`).
- `app/(admin)/admin/login/layout.tsx` — envolve a rota em `AuthProvider`
  próprio (`initialUser: null`), fora do grupo `(protected)`.
- `app/(admin)/admin/login/page.test.tsx` — já existe suíte de testes
  cobrindo o formulário.
- `lib/api/auth.client.ts` — já expõe `login()` chamando `POST
  /auth/login` via `http` (Axios), e `getApiErrorMessage()` que só repassa
  `message` do corpo de erro do backend (não expõe detalhes de
  campo/existência de email).
- A rota real é `app/(admin)/admin/login` (dentro do route group
  `(admin)`), não `app/admin/login` como descrito literalmente no "Como
  implementar" da task — isso é consistente com a convenção de route groups
  já usada no restante do projeto para a área admin (`app/(admin)/admin/
  (protected)/...`), não uma divergência de path real de URL (`(admin)` não
  aparece na URL).

Isto não é uma decisão tomada por este agente — é a constatação de que o
DoD desta task já está satisfeito pelo código atual. Fica sinalizado ao
usuário para validar se:

(a) a task deve ser fechada/movida como já concluída (via `task-manager`,
com validação explícita do usuário, nunca automaticamente); ou

(b) há uma lacuna específica não coberta pela implementação atual que
justifique retrabalho (ex.: algum critério do DoD do Notion que a spec
acima não tenha registrado, ou um ajuste pontual).

Nenhum código-fonte foi alterado por este agente — apenas leitura, conforme
escopo do `spec-writer`.

## Estado real verificado (nesta sessão)

- `package.json` confirma `react-hook-form@^7.87.0`, `zod@^4.5.4` e
  `@hookform/resolvers@^5.9.1` instalados — stack padrão de validação já
  disponível.
- Não há React Router em `dependencies`/`devDependencies`; app 100% App
  Router.
- Contrato de login (`POST /auth/login`, payload `{ email, password }`,
  retorno `{ accessToken, user }`) já está implementado em
  `lib/api/auth.client.ts`, alinhado ao que a spec de `CARSHOP-122`
  documentou a partir do Notion. Não foi encontrado `docs/api-contract.md`
  local nem acesso ao repositório `carshop-backend`; o contrato usado é o já
  registrado em `CARSHOP-122` e implementado em código, que é a fonte mais
  alta segundo a hierarquia do `CLAUDE.md` (código real > Notion).
- Tratamento de erro genérico já evita revelar se um email existe: apenas
  repassa `message` do corpo de erro (`ApiErrorBody`), sem inspecionar
  detalhes de campo específicos de "email não encontrado" vs. "senha
  incorreta".
- Nenhum log de senha/token foi encontrado no fluxo (`login()` apenas
  repassa a resposta ao chamador; quem grava o token é `AuthProvider`, fora
  do escopo desta task).

## Objetivo desta spec

Documentar o estado atual frente ao pedido da task e permitir que o usuário
decida como proceder, em vez de reimplementar algo já existente ou fechar a
task sem validação humana.

## Fora de escopo

- Reimplementar `/admin/login` do zero.
- Alterar o contrato de auth, o `AuthProvider` ou a proteção de rotas
  `(protected)` (fora do DoD desta task específica).
- Mover a task no Notion — decisão exclusiva do usuário via `task-manager`.

## Riscos/Dependências

- Se o usuário confirmar que a implementação atual já atende ao DoD, não há
  trabalho de `developer`/`tester` a fazer aqui além de, no máximo, uma
  validação de cobertura de testes existente contra o DoD do Notion
  (responsabilidade do `tester`, se solicitado).
- Se o Notion tiver critérios de DoD mais específicos não capturados neste
  resumo (ex.: rate limiting, mensagens exatas, redirecionamento pós-login
  diferente de `/admin`), isso precisa ser confrontado item a item pelo
  usuário/`task-reader` antes de qualquer novo trabalho.

## Classificação de tamanho: TRIVIAL

Justificativa: não há mudança de código pendente identificada — o achado
principal é que o escopo descrito já está implementado. Não há decisão
arquitetural a tomar nem múltiplos arquivos a alterar. O único "próximo
passo" é uma confirmação humana sobre o status da task, não uma
implementação.

## Próximos agentes necessários

- `knowledge-reader`: não necessário — não há decisão histórica ou de
  arquitetura pendente para esta constatação.
- `architect`: não necessário — nenhuma decisão estrutural nova está em
  jogo; a arquitetura já foi decidida e implementada em `CARSHOP-122`.
- `plan-writer`: não necessário para uma task `TRIVIAL`.
- `developer`: não necessário até o usuário confirmar se há retrabalho real
  a fazer.
- `tester`: pode ser acionado, a pedido do usuário, apenas para validar que
  a suíte existente (`page.test.tsx`) cobre integralmente o DoD do Notion.
- Ação imediata recomendada: reportar este achado ao usuário antes de
  qualquer outro agente atuar.

## Segurança da especificação

Esta especificação não contém segredos, tokens, senhas, valores de `.env`
nem dados pessoais de clientes.
