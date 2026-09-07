# Rule: UI and Design System

- **TailwindCSS** is the official target styling solution; **Shadcn/UI** for
  base components when appropriate; **Framer Motion** for animations when
  justified by the task (not by default); **React Icons** for icons.
- An approved Figma design is the visual source of truth when an approved
  design exists — agents do not redesign the interface based on their own
  preferences.
- While Tailwind/Shadcn are not installed in `package.json`, styling follows
  the pattern already used in `src/*.css` (CSS/CSS Modules); absence of the
  target dependency is a blocker, not a reason to simulate Tailwind classes
  without the library installed.
- Markup uses appropriate semantic HTML elements by default (not `div`/`span`
  for everything).
- Visual consistency (spacing, typography, colors) is maintained across
  existing components and pages.
