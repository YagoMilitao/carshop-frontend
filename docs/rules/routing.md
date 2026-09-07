# Rule: Routing

- Official target routing: **Next.js App Router** (`app/` files/folders,
  `page.tsx`, `layout.tsx`, route groups, dynamic routes).
- React Router is no longer active guidance for new routes planned within
  this architecture. While the real app still uses Vite + React Router (see
  [docs/rules/architecture.md](./architecture.md)), any new route in the
  existing Vite code follows the pattern already in use until the migration
  happens as an explicit task.
- Protection of authenticated routes is a joint decision between routing
  (`architect`) and authentication (see [docs/rules/auth.md](./auth.md)).
- Do not introduce a second routing convention in parallel — if the task
  requires a new route, follow the current pattern in the touched code.
