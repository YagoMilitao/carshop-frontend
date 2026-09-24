# Rule: UI and Design System

- **TailwindCSS v4** is the styling solution; **Shadcn/UI** (style
  `radix-nova`, see `components.json`) provides base primitives;
  **Framer Motion** for animations when justified by the task (not by
  default); **React Icons** for icons. Confirm versions in `package.json`.
- An approved Figma design is the visual source of truth when an approved
  design exists — agents do not redesign the interface based on their own
  preferences. Otherwise follow `docs/design/`.
- Design tokens (colors, semantic `*-text` variants, focus ring, spacing,
  containers) and the typography scale (`text-heading-*`, `text-body*`,
  `text-label`, `text-nav`, `text-button` utilities) live in
  `app/globals.css`. Use them instead of ad-hoc `text-*`/`font-*`/color
  values for a role the scale or tokens already cover.
- `components/ui/*` is generated or updated only through `npx shadcn add`;
  never hand-write a primitive there. When running the CLI, do not accept
  overwriting existing customized primitives and review the diff.
  Variants added to shared primitives are additive only.
- Icons: application code imports from `react-icons` (Lucide set via
  `react-icons/lu` keeps the same visual style as the primitives).
  `lucide-react` is allowed only inside `components/ui/*`, where the Shadcn
  CLI emits it. Decorative icons use `aria-hidden="true"`.
- Placement: components reused across routes live in `components/`;
  route-specific components live in that route's `_components/`.
- Markup uses appropriate semantic HTML elements by default (not `div`/`span`
  for everything).
- Visual consistency (spacing, typography, colors) is maintained across
  existing components and pages.
