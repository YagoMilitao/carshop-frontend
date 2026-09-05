# Regra: Nomenclatura de Branches

- Padrão obrigatório: `<type>/CARSHOP-<numero>[-<descricao-curta>]`.
- `<type>` reflete a natureza da mudança: `feat`, `fix`, `refactor`, `docs`,
  `chore`, `test`, entre outros tipos convencionais.
- Exemplos: `feat/CARSHOP-123-add-work-filter`,
  `fix/CARSHOP-124-fix-refresh-session`,
  `refactor/CARSHOP-125-simplify-work-service`.
- `<descricao-curta>` é opcional, mas recomendada para legibilidade; usar
  kebab-case.
- Toda branch de trabalho referencia o ID da task do Notion (`CARSHOP-XX`)
  correspondente.
