# CLAUDE.md

Entry point for AI agents (Claude Code) working on the CarShop
Frontend. This file is a short index — the detail for each area lives in
`AGENTS.md`, `docs/agents/`, `docs/rules/`, and `docs/context/`. Never duplicate
the live content of those sources here.

## Official architecture

- **Official architecture and current actual state (converged)**: Next.js
  (App Router) + React + strict TypeScript, with a complementary stack of
  TailwindCSS, Shadcn/UI, TanStack Query, Axios, React Hook Form, Zod,
  Framer Motion, React Icons, and an officially configured testing stack.
  The migration from Vite + React Router to Next.js App Router is
  **complete** (see `package.json`: `next dev`/`next build`/`next start`
  scripts, `next` dependency, no `vite`/`react-router-dom`; and the `app/`
  directory). Detail per area in [docs/rules/](docs/rules/).
- **Never assume a dependency of the stack is installed**: always confirm
  against `package.json` before using it (e.g., confirm the stack is
  Next.js as described, don't just assume it from this document). If
  something is missing, that's a blocker/dependency to flag, never a
  reason to write fictitious code.
- React Router is no longer used in this repository; Server vs Client
  Components is a decision for the `architect` agent (see
  [docs/rules/rendering.md](docs/rules/rendering.md)).
- No agent proposes migrating the Express backend to Next Route Handlers
  without an explicit architectural task/decision from the user (the
  backend is a separate project and has not migrated).

## Sources of truth

From most to least authoritative: **current repository code** →
**approved architectural decisions** (Obsidian `CarShop/Architecture`,
`CarShop/ADRs`) → **current Notion task** (Task Tracker) → **Obsidian
study notes** (`CarShop/Studies`, non-binding). Full detail in
[docs/context/obsidian.md](docs/context/obsidian.md) and
[docs/context/notion.md](docs/context/notion.md).

## Execution flow for a `CARSHOP-XX` task

1. Identify the task (branch, ID, or title provided by the user); never
   assume — ask when there is no confidence.
2. `task-reader` consults the Task Tracker on Notion (Description, DoD, Technical
   Notes, Stack, Sprint, Priority, Component, Status).
3. `spec-writer` produces the task's spec and classifies its size:
   **TRIVIAL** (targeted change, no plan), **SMALL** (few files,
   plan optional), or **NON-TRIVIAL** (plan required).
4. `knowledge-reader` consults Obsidian/internal docs when the task
   benefits from historical/architectural context.
5. `architect` decides structure/routing/Server vs Client Components
   (read-only).
6. `plan-writer` persists `plan.md` **only for NON-TRIVIAL tasks**.
7. `developer` implements following the spec/plan and the rules in
   [docs/rules/](docs/rules/).
8. `tester` covers the DoD with the officially configured testing stack
   (≥80% coverage on new/changed code when applicable).
9. `reviewer` validates the DoD and the points described in
   [.claude/agents/reviewer.md](.claude/agents/reviewer.md) before the task
   is considered ready.
10. `task-manager` never marks a status as `Done` on Notion nor creates new
    tasks without explicit user validation. **Permanent exceptions** (explicit
    user instruction, no need to confirm on each task): when
    the `reviewer` approves the task with no blocking points, (a) the status on
    Notion is automatically updated to `Review` (not `Done`) — see
    [docs/context/notion.md](docs/context/notion.md); and (b) the
    `knowledge-manager` automatically records a relevant note in the Obsidian
    vault (ADR/Learnings/Troubleshooting/Patterns/Architecture,
    depending on the content) — see
    [docs/context/obsidian.md](docs/context/obsidian.md).

Branch convention: `<type>/CARSHOP-<number>-<short-description>` (see
[docs/rules/branching.md](docs/rules/branching.md)).

## Time tracking and performance hotspots

Each phase of the flow above must be timed. If a single phase consumes
more than 50% of the total time spent on the task, this must be flagged
explicitly to the user as a **PERFORMANCE HOTSPOT** (e.g., "PERFORMANCE
HOTSPOT: the `developer` phase consumed 68% of the task's total time"), to help
identify recurring bottlenecks in the workflow.

## Environment variables

- `OBSIDIAN_VAULT_ID` (optional, non-secret): identifies/points to the
  local Obsidian folder/vault to be read by `knowledge-reader` when
  available in the environment. It is not an API credential — Obsidian is always
  accessed by reading local Markdown files, never through a proprietary API (see
  [docs/context/obsidian.md](docs/context/obsidian.md)). If absent, the
  agents notify the user and proceed without consulting Obsidian.
- Other variables (`.env.example`) are the responsibility of the API
  agent ([docs/agents/api-integration.md](docs/agents/api-integration.md)); never
  commit real `.env` values.

## Language for user-facing communication

All output directed at the user (agent responses, summaries, reports,
clarifying questions, explanations) must be in Brazilian Portuguese
(pt-BR); code identifiers, file names, and external technical conventions
keep following the normal rules in [docs/rules/](docs/rules/). Detail in
[docs/agents/shared-rules.md](docs/agents/shared-rules.md). This does not
apply to the repository's own documentation files (`AGENTS.md`,
`CLAUDE.md`, `docs/`), which stay in English by convention.

## Security and general limits

- No agent loads a full `.env` or exposes secrets in specs, plans,
  code, or documentation (see
  [docs/rules/spec-security.md](docs/rules/spec-security.md)).
- Strict TypeScript: never `any`, `@ts-ignore`/`@ts-expect-error`, or unsafe
  casts.
- Each agent acts only within its scope (see
  [.claude/agents/](.claude/agents/) and [docs/agents/](docs/agents/)) and
  explicitly flags when another area needs to be engaged.
