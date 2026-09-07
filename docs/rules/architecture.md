# Rule: Architecture

- Target-official architecture: **Next.js (App Router) + React + strict
  TypeScript**, with a complementary stack of TailwindCSS, Shadcn/UI,
  TanStack Query, Axios, React Hook Form, Zod, Framer Motion, React Icons,
  and an officially configured test stack.
- Actual current state of the repository: Vite + React + React Router.
  The code migration to Next.js is **not** assumed to be done — always
  check `package.json` and the existing configuration (`vite.config.ts`,
  `tsconfig*.json`) before deciding based on the target stack.
- The absence of a target-stack dependency in `package.json` is a
  blocker/dependency to communicate to the user, never a reason to write
  fictitious code or simulate the API of an uninstalled library.
- No agent migrates the app from Vite to Next.js, nor proposes migrating
  the Express backend to Next Route Handlers, without an explicit
  task/architectural decision from the user.
- Sources of truth, from most to least authoritative: current repository
  code → approved architectural decisions (Obsidian) → current Notion
  task → Obsidian study notes. See
  [docs/context/obsidian.md](../context/obsidian.md).
- An approved Figma design (when one exists) is the visual source of
  truth — agents do not redesign the interface based on their own
  preference.
