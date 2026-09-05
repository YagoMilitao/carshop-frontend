# Regra: TypeScript

- Modo estrito sempre. Nunca usar `any`.
- Nunca usar `@ts-ignore`/`@ts-expect-error` para silenciar erros de tipo.
- Nunca usar casts inseguros (`as unknown as X`, `as X` sem garantia real de
  que o valor é `X`).
- Preferir tipos explícitos, narrowing e generics a gambiarras de tipagem.
- Tipos de request/response de API são definidos explicitamente (ver
  [docs/rules/api.md](./api.md)), nunca inferidos como `any` implícito.
- `npm run lint` e a checagem de tipos (`tsc -b`, parte de `npm run build`)
  devem passar sem erros nem supressões antes de considerar a task pronta.
