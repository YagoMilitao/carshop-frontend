# Shared Rules Across Agents

Rules that apply to **all** specialized agents in this repository (CarShop
Frontend), regardless of area of responsibility. Each agent in
`docs/agents/` assumes these rules as a baseline and only documents what
is specific to its own area.

## Stack and technical conventions

- Official target architecture: Next.js (App Router) + React + strict
  TypeScript, with a complementary stack of TailwindCSS, Shadcn/UI,
  TanStack Query, Axios, React Hook Form, Zod, Framer Motion, React Icons,
  and an officially configured testing stack. Details per area in
  [docs/rules/](../rules/).
- Repository's actual current state: React + TypeScript + Vite + React
  Router (see `README.md`, `package.json`). Migrating the code to the
  target architecture is not implied by this task — **always check
  `package.json`** before assuming any target-stack dependency is
  installed. A missing dependency is a blocker/dependency to communicate
  to the user, never a reason to write fictitious code.
- React Router and Vite are no longer active guidance for new
  routing/build decisions — see [docs/rules/routing.md](../rules/routing.md)
  and [docs/rules/nextjs.md](../rules/nextjs.md). No agent migrates the
  app from Vite to Next.js, nor proposes migrating the Express backend to
  Next Route Handlers, without an explicit task/architectural decision.
- Strict TypeScript mode: never use `any`, `@ts-ignore`/`@ts-expect-error`
  to silence type errors, or unsafe casts (`as unknown as X`, `as X`
  without a real guarantee that the value is `X`). Prefer explicit types,
  narrowing, and generics over typing workarounds.
- Code comments should explain **why**, not **what** — they are only worth
  it when they document a non-obvious decision, an external constraint, or
  a workaround. Self-explanatory code doesn't need a comment.

## Mandatory context before implementing

Before any implementation, every agent must follow
[docs/context/context-sync.md](../context/context-sync.md) and
[docs/context/notion.md](../context/notion.md): identify the current task
(`CARSHOP-XX`) and consult the Description, DoD, Technical Notes, Stack,
Sprint, Priority, and Component in the Notion Task Tracker before coding.

## Boundaries between agents

- Each specialized agent (see the list in [AGENTS.md](../../AGENTS.md))
  acts only within its own responsibility. When a task crosses more than
  one area (e.g., a new screen involves architecture, UI, and API
  integration), the agent responsible for the touched part resolves its
  slice and explicitly flags when another area needs to be engaged,
  instead of assuming decisions outside its scope.
- No agent changes the Notion Task Tracker on its own — see the write
  rules in [notion.md](../context/notion.md).

## Minimum checklist (every agent)

- [ ] Current task identified and Notion context consulted
- [ ] No `any`, `@ts-ignore`/`@ts-expect-error`, or unsafe cast introduced
- [ ] Comments added only where the decision is not obvious
- [ ] Changes respect the agent's responsibility boundaries (see
      [AGENTS.md](../../AGENTS.md))
