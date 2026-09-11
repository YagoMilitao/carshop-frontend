# Rule: Routing

- Official routing (in use): **Next.js App Router** (`app/` files/folders,
  `page.tsx`, `layout.tsx`, route groups, dynamic routes) — see
  [docs/rules/architecture.md](./architecture.md).
- React Router is no longer used in this repository; do not introduce it
  for new routes.
- Protection of authenticated routes is a joint decision between routing
  (`architect`) and authentication (see [docs/rules/auth.md](./auth.md)).
- Do not introduce a second routing convention in parallel — if the task
  requires a new route, follow the current pattern in the touched code.
