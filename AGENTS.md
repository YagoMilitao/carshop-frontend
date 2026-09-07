# AGENTS.md

Instructions for agents (Claude Code and others) working on this repository
(CarShop Frontend). This file is a short index — the detail for each area
lives in `docs/agents/`, `docs/rules/`, and `.claude/agents/`.

See [CLAUDE.md](CLAUDE.md) for the official target architecture (Next.js App
Router + complementary stack), the execution flow for a `CARSHOP-XX` task
with the native subagents in [.claude/agents/](.claude/agents/), and the rules
per area in [docs/rules/](docs/rules/).

## Specialized agents

To prevent a single agent from accumulating responsibilities and losing context,
work in this repository is divided among specialized agents. All
follow the [shared rules](docs/agents/shared-rules.md) (strict TypeScript,
no `any`/`@ts-ignore`/unsafe casts, comments only when the
decision isn't obvious, Notion context consulted before implementing) and,
for the full flow of a task, the subagents in
[.claude/agents/](.claude/agents/) (task-reader, spec-writer,
knowledge-reader, architect, plan-writer, developer, tester, reviewer,
task-manager, knowledge-manager).

- [Frontend Architecture](docs/agents/frontend-architect.md) — folder
  structure, routing, state, structural decisions.
- [UI and Styling](docs/agents/ui-tailwind.md) — visual components,
  CSS/Tailwind, responsiveness.
- [API Integration and Authentication](docs/agents/api-integration.md) —
  backend calls, login/session, environment variables.
- [Quality and Accessibility](docs/agents/quality.md) — lint, types,
  tests, accessibility.
- [Context and Documentation](docs/agents/context-sync.md) — identifying the
  current task, consulting Notion, maintaining this documentation.

Each document defines responsibilities, boundaries, inputs, outputs, and its own
checklist. When identifying which area a task belongs to, consult the
corresponding agent before implementing.

## Planning context (Notion)

Before implementing any task, consult the context documentation in
[docs/context/context-sync.md](docs/context/context-sync.md) and, in
particular, [docs/context/notion.md](docs/context/notion.md) for the
Notion consultation flow (CarShop Task Tracker). When relevant, also consult
[docs/context/obsidian.md](docs/context/obsidian.md) for the personal knowledge
context (architecture, ADRs, studies) kept in Obsidian.

Summary of the main rules (full details in `docs/context/notion.md`):

- Identify the current task (`CARSHOP-XX` ID/branch or title) before
  implementing; ask the user if it cannot be identified.
- Consult the Task Tracker on Notion and read the task's Description, DoD, Technical
  Notes, Stack, Sprint, Priority, and Component before coding.
- Notion is the source of truth for planning; this repository is the source of
  truth for code. Do not duplicate Notion's content here.
- Never mark a task as `Done` on Notion without explicit validation of the
  implementation by the user, and never create new tasks without an explicit request.
- Scope changes are only reflected on Notion when requested by the
  user or necessary to keep the task consistent — and even then,
  confirm with the user before writing to Notion.
