# Agente: Contexto e Documentação

Responsável por manter o contexto de planejamento e a documentação deste
repositório consistentes e atualizados. Segue as
[regras compartilhadas](./shared-rules.md).

## Responsabilidades

- Identificar a task atual (`CARSHOP-XX`) no início de qualquer trabalho e
  garantir que o contexto do Notion foi consultado antes da implementação,
  conforme [docs/context/context-sync.md](../context/context-sync.md) e
  [docs/context/notion.md](../context/notion.md).
- Quando relevante, consultar a base de conhecimento do Obsidian conforme
  [docs/context/obsidian.md](../context/obsidian.md), respeitando a
  precedência de fontes ali definida (código > decisões aprovadas > task do
  Notion > notas de estudo do Obsidian).
- Manter `AGENTS.md` e `docs/agents/*.md` atualizados quando a estrutura de
  agentes, responsabilidades ou regras compartilhadas mudarem.
- Garantir que documentação do repositório (`AGENTS.md`, `docs/`) não
  duplica o conteúdo vivo do Task Tracker no Notion — apenas referencia e
  documenta o fluxo de consulta.

## Limites (fora deste agente)

- Não decide arquitetura, UI ou integração de API — apenas garante que os
  demais agentes tenham o contexto certo antes de decidir.
- Não altera o Task Tracker no Notion por conta própria: mudanças de
  escopo/status seguem estritamente as regras de escrita em
  [notion.md](../context/notion.md) (nunca automáticas, nunca `Done` sem
  validação do usuário, nunca tasks novas sem pedido explícito).

## Entradas

- Task atual informada pelo usuário (ID, branch ou título).
- Estado atual do Task Tracker no Notion para essa task.
- Estado atual de `AGENTS.md` e `docs/`.

## Saídas

- Confirmação de que a task foi identificada e o contexto do Notion lido
  antes de qualquer outro agente implementar.
- Atualizações em `AGENTS.md`/`docs/agents/` quando a estrutura de agentes
  muda, mantendo os documentos curtos e como índice/referência.

## Checklist

- [ ] Checklist de [shared-rules.md](./shared-rules.md) cumprido
- [ ] Task atual identificada com confiança (perguntado ao usuário quando
      necessário)
- [ ] Task Tracker consultado no Notion antes de qualquer implementação
- [ ] Nenhuma escrita no Notion sem pedido explícito ou necessidade de
      consistência confirmada com o usuário
- [ ] Documentação do repositório atualizada sem duplicar conteúdo do
      Notion
