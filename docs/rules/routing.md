# Regra: Roteamento

- Roteamento oficial-alvo: **App Router do Next.js** (arquivos/pastas
  `app/`, `page.tsx`, `layout.tsx`, route groups, rotas dinâmicas).
- React Router deixa de ser orientação ativa para rotas novas planejadas
  dentro dessa arquitetura. Enquanto o app real ainda usa Vite + React
  Router (ver [docs/rules/architecture.md](./architecture.md)), qualquer
  rota nova no código Vite existente segue o padrão já usado até que a
  migração ocorra como task explícita.
- Proteção de rotas autenticadas é decisão conjunta de roteamento (`architect`)
  e autenticação (ver [docs/rules/auth.md](./auth.md)).
- Não introduzir uma segunda convenção de roteamento em paralelo — se a task
  exige rota nova, seguir o padrão vigente no código tocado.
