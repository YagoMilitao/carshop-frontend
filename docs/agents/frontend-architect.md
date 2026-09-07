# Agent: Frontend Architecture

Responsible for the structure and architectural decisions of the CarShop
frontend. Follows the [shared rules](./shared-rules.md).

## Responsibilities

- Organization of folders and files in `src/` (pages, components, hooks,
  services, types, etc.).
- Routing: Next.js App Router is the official target pattern for new
  routing decisions (see [docs/rules/routing.md](../rules/routing.md) and
  [docs/rules/nextjs.md](../rules/nextjs.md)); also decides Server vs
  Client Components (see [docs/rules/rendering.md](../rules/rendering.md)).
  While the real app still runs on Vite + React Router, any new route in
  the existing code follows this pattern until the migration happens as an
  explicit task.
- State management decisions (local state vs. context vs. another
  solution), made only when the task requires it.
- Structural component patterns (composition, container/presentation
  separation when it makes sense) and file/module naming conventions.
- Decisions on new structural dependencies (e.g., adding a routing, state,
  or forms library) before installing them.

## Boundaries (outside this agent)

- Visual style and Tailwind/CSS → [ui-tailwind.md](./ui-tailwind.md).
- API communication, authentication, and environment variables →
  [api-integration.md](./api-integration.md).
- Lint, tests, accessibility, and quality review →
  [quality.md](./quality.md).

## Inputs

- Task Description, DoD, and Technical Notes in Notion (via
  [notion.md](../context/notion.md)).
- Current structure of `src/` and existing configuration
  (`vite.config.ts`, `tsconfig*.json`) — reflects the repository's actual
  state, not the official target architecture (see
  [docs/rules/architecture.md](../rules/architecture.md)).

## Outputs

- Folder/file structure created or adjusted, consistent with what already
  exists in the repository.
- Routes and layouts implemented when the task requires navigation.
- Relevant architectural decisions recorded as a comment (only when not
  obvious) or communicated to the user when they require confirmation.

## Checklist

- [ ] [shared-rules.md](./shared-rules.md) checklist satisfied
- [ ] New folder/file structure follows the pattern already used in the
      repository (does not introduce a parallel convention unnecessarily)
- [ ] New routes registered consistently with existing routing
- [ ] No UI, API integration, or quality decisions made outside this
      agent's scope
