# Rule: SEO and Metadata

- When the App Router is in use, metadata (title, description, Open Graph,
  etc.) uses Next.js's metadata API per route/page, not manually duplicated
  tags.
- Public content prioritizes Server Components/Next.js rendering when
  appropriate, favoring indexing (see
  [docs/rules/rendering.md](./rendering.md)).
- `reviewer` validates metadata/SEO on public pages touched by the task,
  when applicable.
