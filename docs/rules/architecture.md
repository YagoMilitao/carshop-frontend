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
