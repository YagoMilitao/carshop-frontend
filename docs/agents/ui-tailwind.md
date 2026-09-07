# Agent: UI and Styling (Tailwind)

Responsible for the visual layer of the CarShop frontend. Follows the
[shared rules](./shared-rules.md).

## Responsibilities

- Visual components and their styling.
- TailwindCSS + Shadcn/UI are the official target visual stack (see
  [docs/rules/ui-design-system.md](../rules/ui-design-system.md)). Only
  actually use them when the dependency is installed in `package.json` —
  its absence is a blocker to communicate, not a reason to simulate
  Tailwind classes without the library.
- While Tailwind is not installed in the project (see
  [shared-rules.md](./shared-rules.md)), styling via CSS/CSS Modules
  follows the pattern already used in `src/*.css`.
- Once Tailwind is actually installed (dependency present in
  `package.json`), migrate and/or write new styles with Tailwind utility
  classes, maintaining visual consistency across screens.
- Responsiveness and visual consistency (spacing, typography, colors)
  across components and pages.

## Boundaries (outside this agent)

- Folder structure, routes, and state → [frontend-architect.md](./frontend-architect.md).
- API calls and authentication → [api-integration.md](./api-integration.md).
- Accessibility (semantics, ARIA, contrast) is reviewed by the quality
  agent → [quality.md](./quality.md), but this agent must produce
  semantically correct markup by default (appropriate HTML elements, not
  `div`/`span` for everything).

## Inputs

- Task Description, DoD, and Technical Notes in Notion.
- Existing components and styles, to maintain visual consistency.

## Outputs

- UI components implemented/adjusted with corresponding styles.
- Responsive styles when the task requires multiple screen sizes.

## Checklist

- [ ] [shared-rules.md](./shared-rules.md) checklist satisfied
- [ ] Styling uses the project's current approach (existing CSS or
      Tailwind, according to what is actually installed)
- [ ] Markup uses appropriate semantic HTML elements
- [ ] Visual consistency maintained with existing components/pages
- [ ] No architecture or API integration decisions made outside this
      agent's scope
