# AGENTS.md

Instruções para agentes (Claude Code e outros) trabalhando neste repositório
(CarShop Frontend). Este arquivo é um índice curto — o detalhe de cada área
fica em `docs/agents/`, `docs/rules/` e `.claude/agents/`.

Ver [CLAUDE.md](CLAUDE.md) para a arquitetura oficial-alvo (Next.js App
Router + stack complementar), o fluxo de execução de uma task `CARSHOP-XX`
com os subagentes nativos em [.claude/agents/](.claude/agents/), e as regras
por área em [docs/rules/](docs/rules/).

## Agentes especializados

Para evitar que um único agente acumule responsabilidades e perca contexto,
o trabalho neste repositório é dividido entre agentes especializados. Todos
seguem as [regras compartilhadas](docs/agents/shared-rules.md) (TypeScript
estrito, sem `any`/`@ts-ignore`/casts inseguros, comentários só quando a
decisão não é óbvia, contexto do Notion consultado antes de implementar) e,
para o fluxo completo de uma task, os subagentes de
[.claude/agents/](.claude/agents/) (task-reader, spec-writer,
knowledge-reader, architect, plan-writer, developer, tester, reviewer,
task-manager, knowledge-manager).

- [Arquitetura de Frontend](docs/agents/frontend-architect.md) — estrutura
  de pastas, roteamento, estado, decisões estruturais.
- [UI e Estilização](docs/agents/ui-tailwind.md) — componentes visuais,
  CSS/Tailwind, responsividade.
- [Integração com API e Autenticação](docs/agents/api-integration.md) —
  chamadas ao backend, login/sessão, variáveis de ambiente.
- [Qualidade e Acessibilidade](docs/agents/quality.md) — lint, tipos,
  testes, acessibilidade.
- [Contexto e Documentação](docs/agents/context-sync.md) — identificação da
  task atual, consulta ao Notion, manutenção desta documentação.

Cada documento define responsabilidades, limites, entradas, saídas e um
checklist próprio. Ao identificar de qual área uma task faz parte, consulte
o agente correspondente antes de implementar.

## Contexto de planejamento (Notion)

Antes de implementar qualquer task, consulte a documentação de contexto em
[docs/context/context-sync.md](docs/context/context-sync.md) e, em
particular, [docs/context/notion.md](docs/context/notion.md) para o fluxo de
consulta ao Notion (Task Tracker do CarShop). Quando relevante, consulte
também [docs/context/obsidian.md](docs/context/obsidian.md) para o contexto
de conhecimento pessoal (arquitetura, ADRs, estudos) mantido no Obsidian.

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
