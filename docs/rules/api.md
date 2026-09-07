# Rule: API

- The backend's Swagger/code is the source of truth for API contracts —
  do not invent fields/endpoints that don't exist in the backend.
- **Axios** is the target-official HTTP client infrastructure for
  client-side calls, when appropriate — it is not mandatory for every
  server-side call (Server Components/Route Handlers can use native
  `fetch`).
- Request/response types are explicit, without `any` (see
  [docs/rules/typescript.md](./typescript.md)).
- Error handling covers the unhappy path: network failure, backend
  error, expired authentication — not just the happy path.
- The repository does not duplicate Express backend endpoints as Next
  Route Handlers without an explicit need (see
  [docs/rules/nextjs.md](./nextjs.md)).
- API environment variables live in `.env.example`, never with real
  values committed. Variables exposed to the browser bundle use the
  `NEXT_PUBLIC_` prefix (e.g. `NEXT_PUBLIC_API_URL`) and never contain
  secrets/credentials; server-only variables do not use that prefix.
  `lib/env/client.ts` (`clientEnv`) and `lib/env/server.ts` (`serverEnv`)
  are the project's single point for reading/validating env — no other
  file should read `process.env.NEXT_PUBLIC_API_URL` directly.
