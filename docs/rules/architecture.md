# Rule: Architecture

- Official architecture: **Next.js (App Router) + React + strict
  TypeScript**, with a complementary stack of TailwindCSS, Shadcn/UI,
  TanStack Query, Axios, React Hook Form, Zod, Framer Motion, React Icons,
  and an officially configured test stack.
- Actual current state of the repository: the migration from Vite + React
  Router to Next.js App Router is **complete** — always confirm against
  `package.json` (`next` scripts/dependency, no `vite`/`react-router-dom`)
  and the existing configuration (`tsconfig*.json`) before deciding, rather
  than assuming this document alone.
- The absence of a stack dependency in `package.json` is a
  blocker/dependency to communicate to the user, never a reason to write
  fictitious code or simulate the API of an uninstalled library.
- No agent proposes migrating the Express backend to Next Route Handlers
  without an explicit task/architectural decision from the user (the
  backend is a separate project and has not migrated).
- Sources of truth, from most to least authoritative: current repository
  code → approved architectural decisions (Obsidian) → current Notion
  task → Obsidian study notes. See
  [docs/context/obsidian.md](../context/obsidian.md).
- An approved Figma design (when one exists) is the visual source of
  truth — agents do not redesign the interface based on their own
  preference.

## Folder structure by responsibility

The repository organizes code by responsibility around the App Router.
This is the current, converged structure — no reorganization is pending;
this section only formalizes the convention already in use:

- `app/` — routes and layouts (App Router). Route groups separate
  concerns without affecting the URL: `app/(public)` for the public site
  (e.g. `about`, `contact`, `portfolio`, `services`) and
  `app/(admin)/admin` for the admin area (e.g. `login`, and the
  authenticated area under `(protected)`).
- `components/ui/` — Shadcn/UI primitives. These are only added/updated
  via the Shadcn CLI, never hand-written from scratch, to keep them in
  sync with upstream.
- `components/` (outside `ui/`) — composed, reusable components shared
  across multiple routes (e.g. `components/layout/` for `header.tsx`,
  `footer.tsx`, `mobile-nav.tsx`, `nav-links.ts`).
- `app/(public)/_components/` and
  `app/(admin)/admin/<feature>/_components/` — **reserved convention**
  for components specific to a single route/feature that don't need to be
  reused elsewhere. `_components` (prefixed with `_`) is a private folder
  in the App Router, so it's never treated as a route segment. Create it
  only when a route-specific component actually shows up; don't
  pre-create empty placeholders.
- `lib/` — shared, non-UI code:
  - `lib/api/` — the API/services layer (e.g. `works.ts`,
    `auth.client.ts`, `auth.server.ts`, `comments.ts`, `http.ts`,
    `images.client.ts`). All HTTP calls to the backend live here.
  - `lib/auth/` — authentication context/providers (e.g.
    `AuthProvider.tsx`).
  - `lib/env/` — environment variable validation (`client.ts`,
    `server.ts`).
  - `lib/utils.ts` — general-purpose utilities.
- `schemas/<domain>.ts` — **reserved convention** for Zod schemas shared
  across more than one component/route (e.g. a `comment` schema used both
  by a form and by `lib/api/comments.ts`). Today schemas are co-located
  with their single consumer (e.g. inside `comment-form.tsx`); only
  extract to `schemas/` once a schema is actually reused, per
  [forms.md](forms.md).
- `hooks/` — **reserved convention**, not created yet: there are no
  shared custom hooks in the codebase today. When the first reusable
  hook appears, it must live at the project root, as a sibling of
  `app/`, `components/`, and `lib/` (never inside `app/` or `lib/`), and
  be imported as `@/hooks/use-xxx`.

There is **no `pages/` folder** in this project, and none should be
created. Routing is handled entirely by the App Router (`app/`); `pages/`
belongs to the legacy Pages Router / pre-migration setups and would
conflict with the current architecture. Any older task description
(e.g. from Notion) referencing a `pages` folder predates the Next.js
migration and does not apply — see "Sources of truth" above.

## Import convention

`tsconfig.json` already configures the `@/*` alias pointing at the
project root (`"@/*": ["./*"]`). Group imports in the following order,
with each group's imports kept together:

1. External libraries (`react`, `next`, `zod`, etc.).
2. Internal imports via the `@/*` alias (e.g. `@/lib/api/works`,
   `@/components/ui/button`).
3. Relative imports (`./...`), reserved for files co-located in the same
   feature/route (e.g. a route's own `_components/`). Never use deep
   relative paths like `../../../` — if a relative import would need to
   cross up more than one directory level, use the `@/*` alias instead.

## API/UI separation

HTTP/API-calling logic must never live inside UI components
(`components/**`) or route files (`app/**/page.tsx`,
`app/**/*.tsx`) beyond what's needed to orchestrate a call to
`lib/api/*`. This is already the pattern followed in the codebase; keep
new code consistent with it — `fetch`/Axios calls belong in `lib/api/*`,
not embedded directly in components or pages.
