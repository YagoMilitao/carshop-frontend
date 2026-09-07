# Rule: State and Server State (TanStack Query)

- **TanStack Query** is the official target solution for interactive server
  state on the client, used only when there is a real need for client-side
  interactivity (not for content that can be a Server Component — see
  [docs/rules/rendering.md](./rendering.md)).
- Local UI state (e.g., opening/closing a modal) does not need TanStack
  Query — use local component state or context when it makes sense.
- Query caching and invalidation are explicitly reviewed by the `reviewer`
  (e.g., a mutation that should invalidate a related query).
- Only use TanStack Query once the dependency is actually installed in
  `package.json` (see [docs/rules/architecture.md](./architecture.md));
  its absence is a blocker, not a reason to write fictitious code.
