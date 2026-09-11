# CARSHOP-19 — Configurar estrutura de pastas do frontend

## Referência
Task Notion: CARSHOP-19 (Backlog, Priority High, Sprint 3, Stack Frontend,
Epic Frontend Base). Ver Descrição/DoD/Technical Notes originais no Notion —
não duplicados aqui.

## Conflito de escopo identificado (flag para o usuário)

A descrição da task no Notion foi escrita assumindo um projeto React "puro"
(CRA/Vite), citando explicitamente a criação de uma pasta `pages`. Segundo
`CLAUDE.md` e `docs/rules/architecture.md`, a fonte de verdade mais alta é o
código atual do repositório, e a migração para **Next.js App Router está
completa** (`app/` já existe, sem `react-router-dom`/`vite` no
`package.json`).

Criar uma pasta `pages` no sentido de roteamento próprio conflitaria
diretamente com o App Router (`app/`) e não deve ser feito. Este spec adapta
o objetivo da task — "estrutura de pastas clara e consistente por
responsabilidade" — à arquitetura atual, sem reintroduzir padrões
pré-migração. Escalando este ponto ao usuário antes de prosseguir para
implementação, conforme instruído.

## Estado atual do repositório (levantado nesta spec)

Estrutura por responsabilidade já existe e está parcialmente alinhada ao
objetivo da task:

- `app/` — rotas do App Router, incluindo grupos `(public)` e
  `(admin)/admin/(protected)`, cada um com seu `layout.tsx`.
- `components/ui/` — componentes de UI reutilizáveis (ex.: `button.tsx`).
- `components/layout/` — componentes de layout (`header.tsx`, `footer.tsx`,
  `mobile-nav.tsx`, `nav-links.ts`).
- `lib/api/` — camada de acesso à API (ex.: `works.ts`, `auth.client.ts`,
  `auth.server.ts`, `comments.ts`, `http.ts`, `images.client.ts`) — cumpre o
  papel de "services" da descrição original.
- `lib/auth/` — `AuthProvider.tsx`.
- `lib/env/` — validação de variáveis de ambiente (`client.ts`,
  `server.ts`).
- `lib/utils.ts` — utilitários gerais.
- `tsconfig.json` já define alias `@/*` apontando para a raiz do projeto.

Não encontrado: uma pasta `hooks/` dedicada a hooks customizados
reutilizáveis (ainda não há necessidade concreta identificada nos
componentes existentes, mas a convenção de onde ela deve ficar quando surgir
não está documentada).

## Objetivo real (adaptado ao Next.js App Router)

Consolidar e documentar a convenção de estrutura de pastas por
responsabilidade já em uso no repositório, cobrindo as lacunas de convenção
(hooks, padrão de import) — sem alterar a estrutura de roteamento existente.

## Escopo

1. Documentar (em `docs/rules/` ou local já usado pelo projeto para
   convenções — decisão do `architect`/`developer` seguindo o padrão
   existente de `docs/rules/*.md`) a convenção atual de pastas:
   `app/` (rotas/layouts), `components/ui/`, `components/layout/`,
   `lib/api/` (camada de API/services), `lib/auth/`, `lib/env/`,
   `lib/utils.ts`.
2. Definir e documentar a convenção para hooks customizados reutilizáveis
   (ex.: `hooks/` na raiz, seguindo o mesmo padrão de `components/` e
   `lib/`), criando a pasta apenas se/quando um hook compartilhado surgir,
   ou criando-a vazia com um placeholder documentado — decisão a validar
   com `architect`.
3. Definir e documentar o padrão de importação: uso do alias `@/*` (já
   configurado em `tsconfig.json`) em vez de caminhos relativos longos, e
   ordem/agrupamento de imports (externos → alias `@/` → relativos), se
   ainda não convencionado.
4. Reforçar textualmente a separação de responsabilidades: lógica de
   chamada à API deve permanecer em `lib/api/`, nunca dentro de componentes
   de UI (`components/`) ou de rotas (`app/**/page.tsx`) além do
   necessário para orquestrar a chamada.

## Fora de escopo

- Criar uma pasta `pages` com roteamento próprio — incompatível com o App
  Router já adotado (`app/`).
- Migrar ou reestruturar rotas existentes em `app/`.
- Renomear/mover arquivos já existentes em `components/` ou `lib/` sem uma
  necessidade concreta identificada (evitar diffs grandes só por
  reorganização).
- Qualquer decisão de Server vs Client Components (fora do escopo desta
  task; ver `docs/rules/rendering.md`).
- Migração do backend Express para Route Handlers do Next.js (não
  autorizada sem decisão arquitetural explícita do usuário).

## Critérios de aceite (derivados do DoD "Estrutura clara e consistente no projeto")

- A convenção de pastas por responsabilidade (rotas, UI, layout, API/
  services, auth, env, utils, hooks) está documentada em local acessível ao
  time (seguindo o padrão de `docs/rules/`).
- O padrão de importação (alias `@/*` e ordem de imports) está documentado.
- Não há mistura de lógica de chamada à API dentro de componentes de UI —
  toda chamada de API passa por `lib/api/*`.
- Nenhuma pasta `pages` de roteamento é introduzida.

## Riscos / Atenção

- Não misturar lógica de API com UI (requisito explícito da task) — validar
  que componentes em `components/` e páginas em `app/` apenas consomem
  funções de `lib/api/`, sem `fetch`/`axios` direto embutido.
- Risco de o time interpretar a task literalmente (criar `pages`) e
  conflitar com o App Router — mitigado por este spec e pelo flag acima.

## Classificação de tamanho

**SMALL** — poucos arquivos afetados (nenhuma mudança de código-fonte
funcional esperada; apenas documentação de convenções já majoritariamente
implementadas e, no máximo, criação de uma pasta `hooks/` vazia/placeholder
e ajuste de imports pontuais). Não há decisão arquitetural nova a tomar (a
arquitetura já está definida como Next.js App Router). Plano formal via
`plan-writer` é opcional.

## Próximos agentes necessários

- `knowledge-reader`: recomendado, para verificar se já existe alguma nota/
  ADR no Obsidian (`CarShop/Architecture` ou `CarShop/ADRs`) sobre convenção
  de pastas ou de imports, evitando divergência com decisões já registradas.
- `architect`: recomendado, apenas para validar a convenção de onde
  documentar (`docs/rules/`) e a decisão sobre criar ou não a pasta
  `hooks/` vazia neste momento.
- `plan-writer`: não obrigatório (task SMALL), pode ser dispensado.
