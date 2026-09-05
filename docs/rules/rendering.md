# Regra: Rendering (Server vs Client Components)

- Server Components são o padrão quando não há necessidade de
  interatividade ou de APIs de browser.
- Client Components (`"use client"`) devem ser introduzidos na menor
  boundary necessária — nunca marcar uma árvore inteira como client por
  conveniência.
- `developer` nunca adiciona `use client` indiscriminadamente; `architect`
  decide e justifica tecnicamente a escolha Server vs Client quando a task
  envolve estrutura nova.
- Conteúdo público prioriza Server Components/renderização do Next quando
  apropriado; estado de servidor interativo no cliente usa TanStack Query
  (ver [docs/rules/state-query.md](./state-query.md)) apenas quando há
  necessidade real de interatividade client-side.
- Cache e estratégia de revalidação (quando o App Router estiver em uso) são
  responsabilidade do `architect`/`developer` e revisadas pelo `reviewer`.
