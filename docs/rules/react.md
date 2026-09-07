# Rule: React

- React is the UI library at every layer (Server and Client Components,
  when the App Router is in use).
- Components follow composition and container/presentation separation
  only when it makes sense for the task — do not introduce premature
  abstraction.
- Hooks follow standard React rules (no conditionals, no loops); lint
  (`eslint-plugin-react-hooks`) must pass without suppressions.
- Prefer small, cohesive components over components that accumulate
  multiple responsibilities; extract only when there is real reuse or
  the task requires it.
- File naming and organization follow the pattern already used in
  `src/` — do not create a parallel convention without need.
