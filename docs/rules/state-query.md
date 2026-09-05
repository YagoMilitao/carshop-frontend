# Regra: Estado e Server State (TanStack Query)

- **TanStack Query** é a solução oficial-alvo para server state interativo
  no cliente, usada apenas quando há necessidade real de interatividade
  client-side (não para conteúdo que pode ser Server Component — ver
  [docs/rules/rendering.md](./rendering.md)).
- Estado local de UI (ex.: abrir/fechar um modal) não precisa de TanStack
  Query — usar estado local de componente ou contexto quando fizer sentido.
- Cache e invalidação de queries são revisados explicitamente pelo
  `reviewer` (ex.: uma mutação que deveria invalidar uma query relacionada).
- Só usar TanStack Query depois que a dependência estiver de fato instalada
  no `package.json` (ver [docs/rules/architecture.md](./architecture.md));
  ausência é bloqueio, não motivo para código fictício.
