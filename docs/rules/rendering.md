# Rule: Rendering (Server vs Client Components)

- Server Components are the default when there is no need for
  interactivity or browser APIs.
- Client Components (`"use client"`) must be introduced at the smallest
  necessary boundary — never mark an entire tree as client for
  convenience.
- `developer` never adds `use client` indiscriminately; `architect`
  decides and technically justifies the Server vs Client choice when the
  task involves new structure.
- Public content prioritizes Server Components/Next's rendering when
  appropriate; interactive server state on the client uses TanStack
  Query (see [docs/rules/state-query.md](./state-query.md)) only when
  there is a real need for client-side interactivity.
- Caching and revalidation strategy (when the App Router is in use) are
  the responsibility of `architect`/`developer` and are reviewed by
  `reviewer`.

## Per-page strategy (CARSHOP-114 / CARSHOP-116)

Decision by `architect`, updated in `CARSHOP-116` to reflect the actual
state after integration with the `Work`s API:

| Page | Rendering today | Server/Client | Cache/revalidation |
|---|---|---|---|
| Home (`app/(public)/page.tsx`) | Static (implicit SSG, no `fetch`) | Server Component | No revalidation — purely static content until dynamic data exists |
| About (`app/(public)/about/page.tsx`) | Static | Server Component | Same |
| Services (`app/(public)/services/page.tsx`) | Static | Server Component | Same |
| Portfolio — listing (`app/(public)/portfolio/page.tsx`) | ISR — real fetch via `getWorks()` (`lib/api/works.ts`, `GET /works`) | Server Component | `revalidate: WORKS_REVALIDATE_SECONDS` (3600s/1h) + `tags: ['works']` on Next's native `fetch` |
| Project Details (`app/(public)/portfolio/[slug]/page.tsx`) | ISR — `generateStaticParams()` via `getWorks()`; body/`generateMetadata` via `getWorkBySlug(slug)`, with `notFound()` when the slug doesn't exist | Server Component (async `generateMetadata`) | Same source/cache as `getWorks()` (`revalidate` 3600s, `tags: ['works']`); per-slug detail is handled by fetching `GET /works` (full list) and filtering on the server, since the backend does not expose a public `GET /works/:slug` — confirmed decision, no dedicated endpoint |
| Contact (`app/(public)/contact/page.tsx`) | Static (wrapper) | Server Component; the future form must be a Client Component isolated at the smallest boundary (not the whole page) | N/A until a form exists |
| Admin (`app/(admin)/admin/**`) | Dynamic, never treated as cacheable public content | Server/Client decision per feature, outside the scope of this task | **Never cached as a public page**: `robots: { index: false, follow: false }` on the route itself (defense in depth) + `disallow: ['/admin', '/admin/']` in `app/robots.ts`; no authenticated/sensitive response should reuse public route cache |

General criterion: the static/dynamic/ISR choice is based on the
characteristics of the displayed data (public content that rarely
changes → static; public content dependent on an API with periodic
updates → ISR; authenticated/sensitive content → always dynamic and
never cached as public), not a single rule applied to the whole app.

## Technical SEO (CARSHOP-114)

- `app/layout.tsx` defines the metadata foundation (`title` with
  `template`, `description`, `metadataBase` based on
  `NEXT_PUBLIC_SITE_URL`, base `openGraph`) inherited by all routes;
  child pages override only the fields they need (`title`,
  `description`, `openGraph.title`, `openGraph.description`).
- `alternates.canonical` is defined on the static public pages
  (About/Services/Portfolio/Contact) and, on Project Details, derived
  from the `slug` received in `generateMetadata` — never a fixed sample
  value.
- `app/robots.ts` and `app/sitemap.ts` (Next.js Metadata Files API) are
  the source of truth for crawling; `/admin` is always excluded from
  both. `app/sitemap.ts` includes, besides the static routes, one entry
  per real published `Work` (`/portfolio/[slug]`, `lastModified` based
  on `work.updatedAt`), obtained via `getWorks()` (`lib/api/works.ts`).
