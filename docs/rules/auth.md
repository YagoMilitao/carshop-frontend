# Regra: Autenticação

- Fluxo de autenticação (login, armazenamento de sessão/token, refresh,
  logout) é definido em conjunto com o roteamento (proteção de rotas
  autenticadas — ver [docs/rules/routing.md](./routing.md)).
- Nenhum agente carrega `.env` completo ou expõe segredos/tokens em specs,
  planos, código, comentários ou documentação.
- Armazenamento de token/sessão segue prática segura (não expor em URL, não
  logar token em texto plano).
- `reviewer` valida explicitamente os fluxos de auth tocados pela task,
  incluindo estados de sessão expirada/erro de autenticação.
