# Sincronização de Contexto dos Agentes

Este documento descreve de onde os agentes que trabalham neste repositório
devem obter contexto antes de iniciar uma task, e como manter esse contexto
consistente entre repositório e ferramentas externas de planejamento.

## Fontes de contexto

- **Código e histórico deste repositório**: arquitetura, convenções e estado
  atual da implementação. Fonte de verdade do código.
- **Notion (CarShop / Task Tracker)**: Sprint, prioridade, descrição, DoD e
  notas técnicas de cada task. Fonte de verdade de planejamento. Ver
  [notion.md](./notion.md) para o fluxo completo de consulta e as regras de
  escrita.

## Regra geral

Antes de implementar qualquer task, o agente deve identificar a task atual e
consultar o Task Tracker no Notion conforme [notion.md](./notion.md). Não
implementar com base apenas em suposições sobre escopo/DoD quando essas
informações estão disponíveis no Notion.

Alterações no Notion (escopo, notas técnicas, status) seguem estritamente as
regras de escrita descritas em [notion.md](./notion.md): nunca automáticas,
nunca para marcar `Done` sem validação do usuário, nunca para criar tasks não
solicitadas.
