# Contexto de Planejamento no Notion

Este documento define como os agentes deste repositório devem consultar o
Notion antes de implementar qualquer task do CarShop Frontend.

## Fonte de verdade

- **Notion → CarShop → Task Tracker** é a fonte de verdade de planejamento:
  Sprint, prioridade, descrição, Definition of Done (DoD) e notas técnicas.
- **Este repositório** é a fonte de verdade do código.
- Nunca duplicar o conteúdo do Task Tracker em arquivos do repositório
  (AGENTS.md, README, etc.). Arquivos do repo guardam apenas referências e
  regras de consulta — o conteúdo vivo permanece no Notion.

## Localização no Notion

- Página raiz do projeto: `CarShop` (workspace de Yago Militão, em
  `Projects / CarShop`).
- Database de tasks: `CarShop / Task Tracker`.
- Cada task é um item (linha) dessa database, identificado pelo título
  (`Task`) e por um ID incremental (`ID`).

## Fluxo obrigatório antes de implementar

1. **Identificar a task atual.** Antes de escrever qualquer código, o agente
   deve saber qual item do Task Tracker está sendo trabalhado. A
   identificação pode vir de:
   - o número/branch `CARSHOP-XX` informado pelo usuário (padrão de branch:
     `feat/CARSHOP-XX-descricao`, `fix/CARSHOP-XX-descricao`, etc.);
   - o título da task citado pelo usuário; ou
   - pergunta direta ao usuário quando a task não puder ser inferida.

   Se a task não puder ser identificada com confiança, o agente deve
   perguntar ao usuário em vez de supor ou inventar uma task.

2. **Consultar o Task Tracker no Notion** (via conector Notion, quando
   disponível no ambiente) e ler, no mínimo, as seguintes propriedades do
   item correspondente:
   - `Task` (título)
   - `Descrição`
   - `DoD (Definition of Done)`
   - `Notas Técnicas`
   - `Stack`
   - `Sprint`
   - `Priority`
   - `Component`
   - `Status` (para saber o estado atual — Backlog, To Do, In Progress,
     Review, Blocked, Cancel, Done)

3. **Usar essas informações para orientar a implementação**: a `Descrição` e
   o `DoD` definem o escopo e o critério de aceite; `Notas Técnicas` traz
   restrições/decisões já tomadas; `Stack`/`Component` ajudam a confirmar que
   a task pertence de fato ao frontend antes de implementar aqui.

4. Se o conector Notion não estiver disponível no ambiente, o agente deve
   avisar o usuário explicitamente e pedir as informações da task
   manualmente (Descrição, DoD, Notas Técnicas) antes de prosseguir, em vez
   de assumir valores.

## Regras de escrita no Notion

- O agente **não deve alterar o Task Tracker automaticamente** como efeito
  colateral de uma implementação.
- Mudanças de escopo (nova nota técnica, ajuste de descrição, mudança de
  Sprint/Priority/Component, etc.) só devem ser refletidas no Notion quando:
  - o usuário pedir explicitamente; ou
  - for necessário para manter a task consistente com o que foi de fato
    implementado (ex.: o escopo mudou durante a implementação e o Notion
    ficaria desatualizado/enganoso se não for ajustado) — e mesmo nesse caso,
    o agente deve confirmar com o usuário antes de escrever no Notion.
- **Nunca marcar uma task como `Done`** (ou qualquer outro status) sem
  validação explícita da implementação pelo usuário. O agente não decide
  sozinho que uma task está concluída.
- **Nunca inventar tasks** no Task Tracker. Uma nova task só é criada a
  pedido explícito do usuário.

## Resumo rápido (checklist do agente)

- [ ] Task atual identificada (ID/branch/título confirmado com o usuário se
      necessário)
- [ ] Task Tracker consultado no Notion para essa task
- [ ] Descrição, DoD, Notas Técnicas, Stack, Sprint, Priority e Component
      lidos
- [ ] Implementação alinhada ao DoD antes de considerar a task concluída
- [ ] Nenhuma escrita no Notion sem pedido explícito ou necessidade de
      consistência confirmada com o usuário
