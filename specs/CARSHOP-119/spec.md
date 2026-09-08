# CARSHOP-119 — Padronizar criação de branches pelos agentes com prefixos Git

## Summary

Task no Notion Task Tracker (Description/DoD/Technical Notes completos:
ver CARSHOP-119). Objetivo: centralizar uma regra de nomeação de branches
para os agentes, com mapeamento explícito de prefixos Git (`feat`, `fix`,
`refactor`, `chore`, `docs`, `test`, `perf`, `ci`, `build`, `style`,
`revert`) escolhidos pela natureza real da mudança — não pelo `Type` da
task no Notion — e exigir que o agente responsável apresente ao usuário,
em pt-BR, o nome sugerido da branch e a justificativa do prefixo.

Esta é uma task de documentação/processo de agentes (Component: Docs,
Infra, Quality), sem alteração de código de aplicação.

## Current repository state (read before writing this spec)

- `docs/rules/branching.md` já existe e é referenciado pelo `CLAUDE.md` e
  por `.claude/agents/developer.md`. Contém hoje:
  - Padrão `<type>/CARSHOP-<numero>[-<descricao-curta>]`.
  - Lista incompleta de tipos: apenas `feat`, `fix`, `refactor`, `docs`,
    `chore`, `test`, "among other conventional types" (sem `perf`, `ci`,
    `build`, `style`, `revert`).
  - Marca `<descricao-curta>` como opcional (a task pede convenção
    `<type>/<task-id>-<short-description>` como padrão quando há ID —
    não há conflito de arquitetura aqui, apenas necessidade de reforçar
    quando há task ID).
  - Não há proibição explícita de `feature/`/`bugfix/`.
  - Não há orientação para escolher o prefixo pela natureza real da
    mudança (vs. copiar o `Type` do Notion), nem tratamento de mudanças
    de natureza múltipla (usar o prefixo do objetivo principal).
  - Não exige que o agente informe nome + justificativa em pt-BR ao
    sugerir a branch.
- `.claude/agents/developer.md` é o único agente que hoje referencia
  `docs/rules/branching.md` diretamente (linha "Work branches follow
  `<type>/CARSHOP-<number>[-<short-description>]`"), mas não instrui o
  agente a classificar a natureza da mudança, evitar `feature`/`bugfix`,
  nem a comunicar nome+justificativa em pt-BR ao usuário. É o agente que,
  na prática, sugere/cria branches durante a implementação.
- Nenhum outro agente (`spec-writer`, `plan-writer`, `task-manager`,
  `reviewer`, etc.) menciona nomenclatura de branch.
- `AGENTS.md` e `docs/agents/shared-rules.md` não duplicam a regra —
  apenas devem continuar apontando para `docs/rules/branching.md` (nenhuma
  mudança necessária ali).

Não há conflito de escopo/arquitetura entre o pedido da task e o estado
atual do repositório — é uma expansão aditiva de uma regra já existente e
referenciada. Nenhuma ambiguidade a escalar ao usuário.

## Scope of change

1. **`docs/rules/branching.md`** (fonte central da regra):
   - Adicionar a lista completa de prefixos oficiais (`feat`, `fix`,
     `refactor`, `chore`, `docs`, `test`, `perf`, `ci`, `build`, `style`,
     `revert`) com definição curta de quando usar cada um (mapeamento da
     Description da task).
   - Deixar explícito: o prefixo reflete a **natureza real da mudança no
     código**, não o `Type` copiado do Notion; em mudanças de natureza
     múltipla, usa-se o prefixo do objetivo principal da branch.
   - Proibir explicitamente `feature/` e `bugfix/` quando `feat`/`fix`
     forem os prefixos oficiais do projeto.
   - Reforçar o padrão `<type>/<task-id>-<short-description>` quando
     existe ID de task, com descrição curta, objetiva, em inglês,
     kebab-case.
   - Adicionar os exemplos completos fornecidos nas Technical Notes
     (`perf/CARSHOP-129-...`, `ci/CARSHOP-130-...`,
     `build/CARSHOP-131-...`, `style/CARSHOP-132-...`,
     `revert/CARSHOP-133-...`, além dos já cobertos).
   - Adicionar a exigência: instruções internas em en-US (mantendo o
     idioma do arquivo), mas o agente que sugere a branch **comunica ao
     usuário em pt-BR** o nome sugerido e uma justificativa curta do
     prefixo escolhido.

2. **`.claude/agents/developer.md`** (agente que hoje referencia branch
   naming ao implementar):
   - Substituir a linha atual de branch naming por uma instrução que:
     (a) aponte para a regra expandida em `docs/rules/branching.md`;
     (b) instrua o agente a classificar a mudança pela intenção real
     antes de sugerir a branch (não usar `feat` apenas porque existe uma
     task Notion); (c) exija apresentar ao usuário, em pt-BR, o nome
     sugerido da branch e a justificativa do prefixo escolhido.

Nenhum outro arquivo de agente precisa mudar: nenhum outro agente cria ou
sugere branches hoje. Se o `plan-writer`/`reviewer` identificarem no
futuro a necessidade de sugerir branch, devem referenciar a mesma regra
central (não duplicá-la) — fora do escopo desta task.

## Out of scope

- Qualquer alteração de código de aplicação.
- Convenção de Conventional Commits (mensagens de commit) — regra
  diferente, não deve ser fundida com branch naming (ver Riscos da task).
- Automação/enforcement via git hooks ou CI (não pedido na Description/DoD).

## Definition of Done mapping

Todos os itens do DoD da task no Notion são cobertos pelas duas
alterações de escopo acima (regra central expandida + instrução do
agente responsável). Nenhum item do DoD exige mudança fora de
`docs/rules/branching.md` e `.claude/agents/developer.md`.

## Size classification: SMALL

Justificativa: apenas 2 arquivos de documentação afetados
(`docs/rules/branching.md` e `.claude/agents/developer.md`), sem decisão
arquitetural, sem código de aplicação, sem múltiplas áreas do sistema
envolvidas. Plano formal (`plan.md`) é opcional e não necessário dado o
escopo contido e a ausência de ambiguidade técnica.

## Next agents needed

- `knowledge-reader`: **não necessário** — não há contexto
  histórico/arquitetural em Obsidian relevante para uma regra de
  nomenclatura de branch já parcialmente estabelecida no repositório.
- `architect`: **não necessário** — não há decisão de estrutura,
  roteamento ou Server/Client Components envolvida.
- `plan-writer`: **não necessário** (task SMALL) — pode seguir direto
  para `developer` com esta spec.
