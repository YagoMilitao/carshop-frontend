# CLAUDE.md

Entry point for AI agents (Claude Code) working on the CarShop Frontend.

This file is intentionally a short index. Detailed rules and context live in:

- `.claude/agents/`
- `docs/agents/shared-rules.md`
- `docs/rules/`
- `docs/design/`
- `docs/context/`

Never duplicate the live content of those sources here.

## Official agent architecture

`.claude/agents/` is the authoritative registry of executable/specialized agents used by the CarShop workflow.

The official agents are:

- `task-reader`
- `spec-writer`
- `knowledge-reader`
- `architect`
- `plan-writer`
- `developer`
- `tester`
- `reviewer`
- `task-manager`
- `knowledge-manager`

Do not create additional specialized agents when an existing agent can own the responsibility without creating scope ambiguity.

In particular, UI responsibilities are intentionally integrated into the existing workflow:

- `architect` owns UI structure and design decisions when the task involves UI;
- `developer` owns UI implementation;
- `reviewer` owns visual compliance review in addition to its normal review responsibilities.

`docs/agents/` must not be treated as an alternative agent registry.

`docs/agents/shared-rules.md` contains rules shared by the official agents.

## Official architecture

- **Official architecture and current actual state (converged)**: Next.js
  (App Router) + React + strict TypeScript, with a complementary stack of
  TailwindCSS, Shadcn/UI, TanStack Query, Axios, React Hook Form, Zod,
  Framer Motion, React Icons, and an officially configured testing stack.

- The migration from Vite + React Router to Next.js App Router is
  **complete**. Confirm the current implementation against `package.json`
  and the repository before making changes.

- **Never assume a dependency is installed**. Always confirm against
  `package.json` before using it. If something required is missing, treat it
  as a dependency/blocker instead of writing fictitious code.

- React Router is no longer used in this repository.

- Server vs Client Components is an architectural decision. Follow
  `docs/rules/rendering.md` and the decision made by the `architect` when
  architecture work is required.

- No agent proposes migrating the separate Express backend to Next.js Route
  Handlers without an explicit architectural task or approved decision from
  the user.

Detailed technical rules live in `docs/rules/`.

## Documentation responsibilities

The repository documentation is divided by responsibility.

### `.claude/agents/`

Defines **who is responsible** for each workflow phase.

### `docs/rules/`

Defines **how the frontend must be implemented technically**.

Examples include:

- architecture;
- rendering;
- routing;
- TypeScript;
- API integration;
- authentication;
- state/query management;
- forms;
- accessibility;
- responsive behavior;
- testing;
- branching;
- security.

### `docs/design/`

Defines **how the CarShop experience should look and behave visually**.

The approved design system is composed of:

- `docs/design/visual-direction.md`
- `docs/design/references.md`
- `docs/design/typography.md`
- `docs/design/colors.md`
- `docs/design/spacing.md`
- `docs/design/components.md`
- `docs/design/imagery.md`

For UI work, these documents are authoritative design guidance unless an
approved Figma specification provides a more specific visual decision.

Agents must not redesign the product based only on personal aesthetic
preference.

### `docs/context/`

Defines **where contextual and historical project knowledge comes from**,
including Notion and Obsidian integration.

## Sources of truth

From most to least authoritative:

1. Current repository code and real runtime/API contracts.
2. Approved architectural decisions and ADRs.
3. Approved Figma, when the task has an applicable approved design.
4. Current Notion task and its Description, DoD, and Technical Notes.
5. Repository rules and design documentation.
6. Obsidian study notes and other non-binding historical context.

Context sources must never silently override current code or real contracts.

When sources conflict, the responsible agent must identify the conflict
instead of silently choosing whichever source is more convenient.

Full context rules live in:

- `docs/context/obsidian.md`
- `docs/context/notion.md`
- `docs/context/context-sync.md`

## UI source hierarchy

For visual implementation, use the following hierarchy:

1. Approved Figma for the specific screen or component.
2. `docs/design/`.
3. Current Notion task and approved product requirements.
4. Existing established CarShop components and patterns.
5. General frontend/design knowledge.

Lower-priority sources must not silently override higher-priority sources.

Reference websites documented in `docs/design/references.md` are inspiration,
not templates.

Never copy another business's visual identity, content, imagery, or
distinctive page composition.

## Execution flow for a `CARSHOP-XX` task

1. Identify the task from the branch, ID, or title provided by the user.
   Never assume the task when there is insufficient confidence.

2. `task-reader` consults the Task Tracker on Notion and retrieves the
   relevant task context, including Description, DoD, Technical Notes,
   Stack, Sprint, Priority, Component, and Status.

3. `spec-writer` produces the task specification and classifies its size:

   - **TRIVIAL** — targeted change; no persisted plan.
   - **SMALL** — limited scope; plan optional.
   - **NON-TRIVIAL** — persisted plan required.

4. `knowledge-reader` consults Obsidian and internal documentation when the
   task benefits from historical or architectural context.

5. `architect` decides architecture when architectural decisions are
   required, including structure, routing, Server vs Client Components,
   component boundaries, and relevant data boundaries.

   For UI tasks, the `architect` also defines the structural visual strategy
   using approved Figma and `docs/design/`, including information hierarchy,
   section composition, responsive strategy, component boundaries, and image
   strategy.

   The `architect` remains read-only.

6. `plan-writer` persists `plan.md` only for **NON-TRIVIAL** tasks.

7. `developer` implements the task following:

   - the approved specification;
   - the plan when one exists;
   - architectural decisions;
   - `docs/rules/`;
   - `docs/design/` when UI is involved;
   - real API contracts when backend communication is involved.

8. `tester` validates the applicable DoD using the officially configured
   testing stack.

   New or changed code should reach at least 80% coverage when coverage is
   applicable to the task.

9. `reviewer` validates the DoD and performs the final technical review.

   When UI is touched, the reviewer additionally performs visual compliance
   review against approved Figma and `docs/design/`, including:

   - visual direction;
   - typography;
   - colors;
   - spacing;
   - imagery;
   - component usage;
   - responsive behavior;
   - accessibility;
   - visual drift.

10. `task-manager` never marks a task as `Done` and never creates a new task
    without explicit user validation.

    Permanent exception already approved by the user:

    When the `reviewer` approves a task with no blocking findings, the
    corresponding Notion task is automatically moved to `Review`, not
    `Done`.

11. After an approved review, `knowledge-manager` records relevant reusable
    knowledge in the Obsidian vault when the implementation produced useful
    architectural, troubleshooting, learning, or pattern knowledge.

Detailed agent responsibilities live exclusively in `.claude/agents/`.

## Backend contract rule

Frontend agents must never invent backend endpoints or HTTP contracts.

Before implementing frontend behavior that communicates with the backend,
consult the applicable sources of truth, including:

- current API contract documentation;
- Swagger/OpenAPI when available;
- current backend routes/code when required;
- the current Notion task.

The real HTTP contract is authoritative for:

- HTTP method;
- route;
- path parameters;
- query parameters;
- request body;
- headers;
- cookies;
- status codes;
- response structure.

When a required endpoint does not exist, record the dependency instead of
inventing an endpoint.

## Design implementation rule

Public CarShop UI represents a real US automotive upholstery/custom interior
business.

Public experiences should communicate:

- automotive craftsmanship;
- custom interiors;
- restoration;
- material quality;
- precision;
- trust;
- local business credibility.

Public UI must not default to generic SaaS visual patterns.

Photography should demonstrate the craftsmanship rather than act as generic
automotive decoration.

Admin UI has different priorities and may use conventional application
patterns when they improve clarity, efficiency, and accessibility.

Full visual rules live in `docs/design/`.

## Branch convention

Use:

`<type>/CARSHOP-<number>`

Follow the detailed branching rules in:

`docs/rules/branching.md`

## Time tracking and performance hotspots

Each workflow phase must be timed.

If a single phase consumes more than 50% of the total task execution time,
explicitly report it to the user as a:

**PERFORMANCE HOTSPOT**

Example:

`PERFORMANCE HOTSPOT: the developer phase consumed 68% of the task's total time.`

The purpose is to identify recurring workflow bottlenecks.

## Environment variables

- `OBSIDIAN_VAULT_ID` is optional and non-secret.

  It identifies or points to the local Obsidian vault used by
  `knowledge-reader` when available.

  Obsidian is accessed through local Markdown files, not through a
  proprietary Obsidian API.

  If the vault is unavailable, the responsible agent must report the missing
  context and continue when the task can safely proceed without it.

- Application environment variables are documented through `.env.example`
  and the applicable rules in `docs/rules/`.

- Never commit real secrets.

- Never expose complete `.env` contents in specs, plans, logs, reports, code
  comments, or documentation.

## Language for user-facing communication

All output directed at the user must be in Brazilian Portuguese (`pt-BR`),
including:

- agent responses;
- summaries;
- reports;
- questions;
- explanations;
- review findings.

Code identifiers, filenames, APIs, libraries, and external technical
conventions retain their normal language.

Repository documentation remains in English by convention, including:

- `CLAUDE.md`;
- agent definitions;
- `docs/`.

Shared language rules live in:

`docs/agents/shared-rules.md`

## Security and general limits

- Strict TypeScript is mandatory.

- Never use:

  - `any`;
  - `as any`;
  - `@ts-ignore`;
  - `@ts-expect-error`;
  - unsafe casts used to bypass the type system.

- Never expose secrets.

- Never invent API contracts.

- Never invent business information.

- Never silently override approved architectural or visual decisions.

- Never treat reference websites as templates to copy.

- Each agent acts only within the scope defined in `.claude/agents/`.

- When another responsibility is required, explicitly hand the concern to
  the appropriate existing agent instead of expanding the current agent's
  scope or inventing a new agent.

## Final workflow principle

Keep the workflow specialized without duplicating responsibilities.

Agents define ownership.

Rules define technical constraints.

Design documentation defines visual constraints.

Context documentation provides project knowledge.

The current repository and real contracts remain the ultimate implementation
reality.