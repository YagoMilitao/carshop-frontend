# Rule: TypeScript

- Strict mode always. Never use `any`.
- Never use `@ts-ignore`/`@ts-expect-error` to silence type errors.
- Never use unsafe casts (`as unknown as X`, `as X` without real assurance
  that the value is `X`).
- Prefer explicit types, narrowing, and generics over typing hacks.
- API request/response types are defined explicitly (see
  [docs/rules/api.md](./api.md)), never inferred as implicit `any`.
- `npm run lint` and type checking (`tsc -b`, part of `npm run build`) must
  pass without errors or suppressions before considering the task done.
