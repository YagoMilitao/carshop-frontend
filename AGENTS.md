# AGENTS.md

Instruções para agentes (Claude Code e outros) trabalhando neste repositório
(CarShop Frontend).

## Contexto de planejamento (Notion)

Antes de implementar qualquer task, consulte a documentação de contexto em
[docs/context/context-sync.md](docs/context/context-sync.md) e, em
particular, [docs/context/notion.md](docs/context/notion.md) para o fluxo de
consulta ao Notion (Task Tracker do CarShop).

Resumo das regras principais (detalhes completos em `docs/context/notion.md`):

- Identifique a task atual (ID/branch `CARSHOP-XX` ou título) antes de
  implementar; pergunte ao usuário se não for possível identificá-la.
- Consulte o Task Tracker no Notion e leia Descrição, DoD, Notas Técnicas,
  Stack, Sprint, Priority e Component da task antes de codar.
- Notion é a fonte de verdade de planejamento; este repositório é a fonte de
  verdade do código. Não duplique o conteúdo do Notion aqui.
- Nunca marque uma task como `Done` no Notion sem validação explícita da
  implementação pelo usuário, e nunca crie tasks novas sem pedido explícito.
- Alterações de escopo só são refletidas no Notion quando solicitadas pelo
  usuário ou necessárias para manter a task consistente — e mesmo assim,
  confirme com o usuário antes de escrever no Notion.
