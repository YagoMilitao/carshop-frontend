# Rule: Next.js (App Router)

- App Router is the target-official routing (not Pages Router, not React
  Router) for any new route planned within this architecture.
- This only actually applies once the project has the `next` dependency
  installed in `package.json`. Until then, treat it as a documented
  architecture decision, not as an implementation in progress.
- App Router file conventions (`page.tsx`, `layout.tsx`, `loading.tsx`,
  `error.tsx`, `not-found.tsx`, route groups) are the basis for
  organizing routes once the migration happens.
- Do not duplicate Express backend endpoints as Next Route Handlers
  without an explicit need — the backend remains the source of API
  contracts (see [docs/rules/api.md](./api.md)).
- Metadata/SEO use the App Router's metadata API when applicable (see
  [docs/rules/seo.md](./seo.md)).
