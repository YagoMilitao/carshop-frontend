# CLAUDE.md

Ponto de entrada para agentes de IA (Claude Code) trabalhando no CarShop
Frontend. Este arquivo é um índice curto — o detalhe de cada área vive em
`AGENTS.md`, `docs/agents/`, `docs/rules/` e `docs/context/`. Nunca duplicar
aqui o conteúdo vivo dessas fontes.

## Arquitetura oficial

- **Alvo**: Next.js (App Router) + React + TypeScript estrito, com stack
  complementar TailwindCSS, Shadcn/UI, TanStack Query, Axios, React Hook
  Form, Zod, Framer Motion, React Icons e uma stack de testes oficialmente
  configurada. Detalhe por área em [docs/rules/](docs/rules/).
- **Estado real atual**: o app ainda roda em Vite + React Router (ver
  `package.json`, `vite.config.ts`) — a migração de código não faz parte
  desta configuração de workflow. **Nunca assuma uma dependência da stack
  alvo como instalada**: confira `package.json` antes de usá-la. Se faltar,
  isso é um bloqueio/dependência a sinalizar, nunca um motivo para escrever
  código fictício.
- React Router deixa de ser orientação ativa para rotas novas; Server vs
  Client Components é decisão do agente `architect` (ver
  [docs/rules/rendering.md](docs/rules/rendering.md)).
- Nenhum agente propõe migrar o backend Express para Next Route Handlers, ou
  migrar o app Vite para Next.js, sem uma task/decisão arquitetural
  explícita do usuário.

## Fontes de verdade

Da mais para a menos autoritativa: **código atual do repositório** →
**decisões arquiteturais aprovadas** (Obsidian `CarShop/Architecture`,
`CarShop/ADRs`) → **task atual do Notion** (Task Tracker) → **notas de
estudo do Obsidian** (`CarShop/Studies`, não vinculante). Detalhe completo em
[docs/context/obsidian.md](docs/context/obsidian.md) e
[docs/context/notion.md](docs/context/notion.md).

## Fluxo de execução de uma task `CARSHOP-XX`

1. Identificar a task (branch, ID ou título informado pelo usuário); nunca
   supor — perguntar quando não houver confiança.
2. `task-reader` consulta o Task Tracker no Notion (Descrição, DoD, Notas
   Técnicas, Stack, Sprint, Priority, Component, Status).
3. `spec-writer` produz a spec da task e classifica o tamanho:
   **TRIVIAL** (mudança pontual, sem plano), **SMALL** (poucos arquivos,
   plano opcional) ou **NON-TRIVIAL** (plano obrigatório).
4. `knowledge-reader` consulta Obsidian/docs internas quando a task se
   beneficia de contexto histórico/arquitetural.
5. `architect` decide estrutura/roteamento/Server vs Client Components
   (somente leitura).
6. `plan-writer` persiste `plan.md` **apenas para tasks NON-TRIVIAL**.
7. `developer` implementa seguindo a spec/plano e as regras em
   [docs/rules/](docs/rules/).
8. `tester` cobre o DoD com a stack de testes oficialmente configurada
   (≥80% de cobertura em código novo/alterado quando aplicável).
9. `reviewer` valida o DoD e os pontos descritos em
   [.claude/agents/reviewer.md](.claude/agents/reviewer.md) antes de a task
   ser considerada pronta.
10. `task-manager` nunca marca status `Done` no Notion nem cria tasks novas
    sem validação explícita do usuário. **Exceções permanentes** (instrução
    explícita do usuário, sem necessidade de confirmar a cada task): quando
    o `reviewer` aprova a task sem pontos bloqueantes, (a) o status no
    Notion é atualizado automaticamente para `Review` (não `Done`) — ver
    [docs/context/notion.md](docs/context/notion.md); e (b) o
    `knowledge-manager` registra automaticamente uma nota relevante no vault
    do Obsidian (ADR/Learnings/Troubleshooting/Patterns/Architecture,
    conforme o conteúdo) — ver
    [docs/context/obsidian.md](docs/context/obsidian.md).

Convenção de branch: `<type>/CARSHOP-<numero>[-<descricao-curta>]` (ver
[docs/rules/branching.md](docs/rules/branching.md)).

## Registro de tempo e hotspots de performance

Cada fase do fluxo acima deve ser cronometrada. Se uma única fase consumir
mais de 50% do tempo total gasto na task, isso deve ser sinalizado
explicitamente ao usuário como **PERFORMANCE HOTSPOT** (ex.: "PERFORMANCE
HOTSPOT: fase `developer` consumiu 68% do tempo total da task"), para ajudar
a identificar gargalos recorrentes no workflow.

## Variáveis de ambiente

- `OBSIDIAN_VAULT_ID` (opcional, não-secreta): identifica/aponta a
  pasta/vault local do Obsidian a ser lida por `knowledge-reader` quando
  disponível no ambiente. Não é uma credencial de API — o Obsidian é sempre
  acessado lendo arquivos Markdown locais, nunca por API proprietária (ver
  [docs/context/obsidian.md](docs/context/obsidian.md)). Se ausente, os
  agentes avisam o usuário e seguem sem consultar o Obsidian.
- Demais variáveis (`.env.example`) são responsabilidade do agente de API
  ([docs/agents/api-integration.md](docs/agents/api-integration.md)); nunca
  commitar valores reais de `.env`.

## Segurança e limites gerais

- Nenhum agente carrega `.env` completo ou expõe segredos em specs, planos,
  código ou documentação (ver
  [docs/rules/spec-security.md](docs/rules/spec-security.md)).
- TypeScript estrito: nunca `any`, `@ts-ignore`/`@ts-expect-error`, ou casts
  inseguros.
- Cada agente atua apenas dentro do seu escopo (ver
  [.claude/agents/](.claude/agents/) e [docs/agents/](docs/agents/)) e
  sinaliza explicitamente quando outra área precisa ser acionada.
