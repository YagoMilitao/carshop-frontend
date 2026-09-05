# CARSHOP-113 — Migrar frontend base de Vite para Next.js App Router

## Metadados (Notion)

- Epic: Frontend Base
- Type: Task
- Sprint: Sprint 3
- Priority: High
- Points: 8
- Status: To Do
- Stack: Frontend
- Component: Infra, Public UI, Admin UI, Quality

Descrição, DoD e Notas Técnicas completas: ver task no Task Tracker
(Notion) `CARSHOP-113`. Este documento resume apenas o necessário para
execução e não duplica o conteúdo integral do Notion.

## Resumo

Substituir a base Vite + React Router (orientação de arquitetura anterior)
por Next.js (App Router), mantendo React e TypeScript strict, e preservando
o backend Node/Express como serviço independente (sem migrar para Route
Handlers, sem duplicar contratos de API). A migração é autorizada
explicitamente por esta task, conforme previsto no `CLAUDE.md` do
repositório ("Nenhum agente propõe migrar... sem uma task/decisão
arquitetural explícita do usuário").

## Estado real do repositório (verificado antes da spec)

- `package.json`: projeto Vite puro (`vite`, `@vitejs/plugin-react`,
  scripts `dev`/`build`/`preview` via Vite). **`react-router-dom` não está
  instalado** nas dependências atuais — não há roteamento de terceiros em
  uso hoje.
- `vite.config.ts`: configuração mínima, apenas plugin React.
- `src/`: contém somente o boilerplate padrão gerado pelo `create-vite`
  (`App.tsx`, `App.css`, `main.tsx`, `index.css`, `assets/react.svg`) — não
  há páginas, rotas, ou features de negócio implementadas ainda (Home,
  Services, Portfolio, Project Details, Admin não existem no código).
- `.env.example` já contém `NEXT_PUBLIC_API_URL`, sugerindo que a
  intenção de migrar para Next já estava planejada mesmo antes desta task
  formalizar a decisão.
- Não há backend Express neste repositório (é frontend-only); o backend é
  tratado como serviço externo/independente, consistente com o DoD.
- Não existe diretório `specs/` previamente neste repositório — este é o
  primeiro registro, seguindo o formato descrito em
  `.claude/agents/spec-writer.md`.

## Observação (não é conflito bloqueante, mas deve ser sinalizada)

O DoD menciona explicitamente "React Router não é instalado nem utilizado".
No estado real do repositório, React Router **já não está instalado** —
portanto esse item do DoD já está satisfeito trivialmente pelo estado
atual e não exige remoção de código, apenas a garantia de não instalá-lo
durante a migração. Isso reduz o risco dessa parte específica da task, mas
não muda a classificação de tamanho, pois o grosso do trabalho é a troca de
toolchain/build (Vite → Next.js), a criação da estrutura `app/` e a
decisão consciente de Server vs Client Components — que ainda não existem
no código.

Nenhum outro conflito de escopo foi identificado entre Descrição/DoD e o
estado real do repositório; sinalizando ao usuário apenas o ponto acima
para ciência antes de prosseguir.

## Escopo (a partir do DoD do Notion, resumido)

Incluído:

- Adotar Next.js App Router como framework oficial (build, dev, lint,
  typecheck via toolchain Next).
- Manter React 19 e TypeScript strict; nenhum `any`/`as any`/`@ts-ignore`.
- Remover Vite do runtime/build ativo (`vite`, `@vitejs/plugin-react`,
  `vite.config.ts`, `index.html` do Vite) somente após confirmar que nada
  de conteúdo necessário se perde.
- Criar estrutura `app/` com layout raiz e rotas base coerentes, sem
  implementar features de negócio fora do escopo desta task.
- Uso consciente de Server Components vs Client Components (decisão do
  `architect`; `use client` não aplicado indiscriminadamente).
- Atualizar README/documentação de setup para refletir Next.js App Router
  + backend Express independente como stack oficial.
- Garantir build, lint, typecheck e smoke tests da nova base passando.

Fora de escopo (explicitamente, conforme Notas Técnicas):

- Migrar o backend Express para Next Route Handlers.
- Criar endpoints Next duplicando contratos existentes do backend.
- Implementar features de negócio (Home, Services, Portfolio, Project
  Details, Admin) além da estrutura base de rotas/layout.

## Segurança

- Nenhum segredo real de `.env` é referenciado neste documento (apenas
  nomes de variáveis, ex.: `NEXT_PUBLIC_API_URL`).
- DoD exige nenhum segredo exposto ao cliente durante a migração —
  atenção especial a variáveis `NEXT_PUBLIC_*` vs variáveis server-only ao
  desenhar a nova estrutura de config/env no plano.

## Classificação de tamanho

**NON-TRIVIAL.**

Justificativa: troca de toolchain de build/framework (Vite → Next.js),
múltiplas áreas afetadas (Infra, Public UI, Admin UI, Quality), decisão
arquitetural explícita de Server vs Client Components, impacto em
lint/typecheck/testes/documentação, e Points=8/Priority=High no Notion.
Plano obrigatório via `plan-writer`.

## Próximos agentes

1. `knowledge-reader` — consultar Obsidian (`CarShop/Architecture`,
   `CarShop/ADRs`, e possivelmente `CarShop/Studies`) por decisões prévias
   ou estudos relacionados à escolha de Next.js App Router, SEO/metadata
   para o site público, e à separação Public UI vs Admin UI, antes do
   `architect` desenhar a estrutura. Também confirmar se
   `OBSIDIAN_VAULT_ID` está disponível no ambiente.
2. `architect` — decidir estrutura de pastas em `app/`, roteamento base,
   e a separação Server/Client Components para páginas públicas
   (indexáveis) vs área admin (client-side), respeitando
   `docs/rules/rendering.md`.
3. `plan-writer` — obrigatório (task NON-TRIVIAL): produzir `plan.md` com
   passos de migração (setup Next.js, remoção gradual de Vite, ajuste de
   lint/typecheck/scripts, atualização de README, smoke tests), incluindo
   ordem segura para não perder conteúdo do código atual (que hoje é só
   boilerplate, reduzindo risco de perda real).
