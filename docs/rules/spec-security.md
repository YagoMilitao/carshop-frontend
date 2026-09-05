# Regra: Segurança de Specs e Planos

- Specs (`specs/CARSHOP-XX/`) e planos (`plan.md`) gerados pelo workflow
  nunca incluem segredos, tokens, senhas ou conteúdo de `.env`.
- Nunca copiar valores reais de variáveis de ambiente para spec/plano/docs —
  apenas nomes de variáveis, quando relevante.
- Specs/planos não expõem dados pessoais de clientes desnecessariamente; se
  um exemplo real for necessário para contexto, usar dado fictício/anonimizado.
- `spec-writer` e `plan-writer` são responsáveis por essa checagem antes de
  persistir o arquivo correspondente.
