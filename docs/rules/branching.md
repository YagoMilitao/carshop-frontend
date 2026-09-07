# Rule: Branch Naming

- Mandatory pattern: `<type>/CARSHOP-<numero>[-<descricao-curta>]`.
- `<type>` reflects the nature of the change: `feat`, `fix`, `refactor`,
  `docs`, `chore`, `test`, among other conventional types.
- Examples: `feat/CARSHOP-123-add-work-filter`,
  `fix/CARSHOP-124-fix-refresh-session`,
  `refactor/CARSHOP-125-simplify-work-service`.
- `<descricao-curta>` is optional, but recommended for readability; use
  kebab-case.
- Every working branch references the corresponding Notion task ID
  (`CARSHOP-XX`).
