# Regras Compartilhadas entre Agentes

Regras que valem para **todos** os agentes especializados deste repositório
(CarShop Frontend), independentemente da área de responsabilidade. Cada
agente em `docs/agents/` assume estas regras como base e só documenta o que
é específico da sua área.

## Stack e convenções técnicas

- Arquitetura oficial-alvo: Next.js (App Router) + React + TypeScript
  estrito, com stack complementar TailwindCSS, Shadcn/UI, TanStack Query,
  Axios, React Hook Form, Zod, Framer Motion, React Icons e uma stack de
  testes oficialmente configurada. Detalhe por área em
  [docs/rules/](../rules/).
- Estado real atual do repositório: React + TypeScript + Vite + React Router
  (ver `README.md`, `package.json`). A migração de código para a arquitetura
  alvo não está implícita nesta task — **sempre confira `package.json`**
  antes de assumir qualquer dependência da stack alvo como instalada.
  Ausência de dependência é um bloqueio/dependência a comunicar ao usuário,
  nunca um motivo para escrever código fictício.
- React Router e Vite deixam de ser orientação ativa para decisões novas de
  roteamento/build — ver [docs/rules/routing.md](../rules/routing.md) e
  [docs/rules/nextjs.md](../rules/nextjs.md). Nenhum agente migra o app de
  Vite para Next.js, nem propõe migrar o backend Express para Next Route
  Handlers, sem uma task/decisão arquitetural explícita.
- TypeScript em modo estrito: nunca usar `any`, `@ts-ignore`/`@ts-expect-error`
  para silenciar erros de tipo, ou casts inseguros (`as unknown as X`,
  `as X` sem garantia real de que o valor é `X`). Preferir tipos explícitos,
  narrowing e generics a gambiarras de tipagem.
- Comentários no código devem explicar o **porquê**, não o **quê** — só valem
  a pena quando documentam uma decisão não óbvia, uma restrição externa ou um
  workaround. Código autoexplicativo não precisa de comentário.

## Contexto obrigatório antes de implementar

Antes de qualquer implementação, todo agente deve seguir
[docs/context/context-sync.md](../context/context-sync.md) e
[docs/context/notion.md](../context/notion.md): identificar a task atual
(`CARSHOP-XX`) e consultar Descrição, DoD, Notas Técnicas, Stack, Sprint,
Priority e Component no Task Tracker do Notion antes de codar.

## Limites entre agentes

- Cada agente especializado (ver lista em [AGENTS.md](../../AGENTS.md)) atua
  apenas dentro da sua responsabilidade. Quando uma task cruza mais de uma
  área (ex.: uma tela nova envolve arquitetura, UI e integração com API), o
  agente responsável pela parte tocada resolve sua fatia e sinaliza
  explicitamente quando outra área precisa ser acionada, em vez de assumir
  decisões fora do seu escopo.
- Nenhum agente altera o Task Tracker do Notion por conta própria — ver
  regras de escrita em [notion.md](../context/notion.md).

## Checklist mínimo (todo agente)

- [ ] Task atual identificada e contexto do Notion consultado
- [ ] Nenhum `any`, `@ts-ignore`/`@ts-expect-error` ou cast inseguro
      introduzido
- [ ] Comentários adicionados apenas onde a decisão não é óbvia
- [ ] Mudanças respeitam os limites de responsabilidade do agente (ver
      [AGENTS.md](../../AGENTS.md))
