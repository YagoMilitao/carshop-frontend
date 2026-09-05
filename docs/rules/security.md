# Regra: Segurança

- Nenhum agente carrega `.env` completo ou expõe segredos, tokens ou senhas
  em código, comentários, specs, planos ou documentação.
- `.env.example` documenta apenas nomes de variáveis, nunca valores reais.
- Vault do Obsidian nunca armazena segredos, tokens ou conteúdo de `.env`
  (ver [docs/context/obsidian.md](../context/obsidian.md)).
- Dados sensíveis (ex.: dados pessoais de clientes) não são logados em texto
  plano nem incluídos em specs/planos sem necessidade.
- Ver também [docs/rules/spec-security.md](./spec-security.md) para regras
  específicas de specs/planos gerados pelo workflow.
