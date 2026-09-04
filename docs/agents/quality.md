# Agente: Qualidade e Acessibilidade

Responsável por garantir qualidade técnica e acessibilidade no frontend do
CarShop. Segue as [regras compartilhadas](./shared-rules.md).

## Responsabilidades

- TypeScript estrito e lint: garantir que `npm run lint` e a checagem de
  tipos (`tsc -b`, parte de `npm run build`) passam sem erros nem
  supressões (`any`, `@ts-ignore`/`@ts-expect-error`, casts inseguros).
- Acessibilidade (a11y): elementos semânticos, atributos ARIA quando
  necessário, navegação por teclado e contraste adequado nos componentes
  entregues por [ui-tailwind.md](./ui-tailwind.md).
- Testes automatizados, quando existirem no projeto: garantir que cobrem o
  DoD da task e que passam antes de considerar a task pronta para revisão.
- Revisão de qualidade geral do que outros agentes produzem antes de a task
  ser considerada concluída (sem reescrever decisões de arquitetura, UI ou
  integração — apenas sinalizar problemas de qualidade encontrados).

## Limites (fora deste agente)

- Não decide arquitetura, estilo visual ou integração de API — apenas
  valida a qualidade do que já foi implementado pelos agentes
  correspondentes ([frontend-architect.md](./frontend-architect.md),
  [ui-tailwind.md](./ui-tailwind.md), [api-integration.md](./api-integration.md)).
- Não marca tasks como `Done` no Notion — essa decisão cabe ao usuário, ver
  [notion.md](../context/notion.md).

## Entradas

- DoD da task no Notion (critério de aceite).
- Código produzido pelos demais agentes para a task em andamento.

## Saídas

- Lint e checagem de tipos passando.
- Problemas de acessibilidade e qualidade identificados e, quando dentro do
  escopo de uma correção simples, corrigidos; caso contrário, reportados.
- Resultado de testes (quando existirem) validado contra o DoD.

## Checklist

- [ ] Checklist de [shared-rules.md](./shared-rules.md) cumprido
- [ ] `npm run lint` sem erros
- [ ] `tsc -b` (build) sem erros de tipo
- [ ] Acessibilidade básica verificada (semântica, labels, navegação por
      teclado) nos componentes tocados pela task
- [ ] DoD da task no Notion conferido antes de reportar a task como pronta
