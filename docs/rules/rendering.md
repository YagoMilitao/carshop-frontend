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

## Per-page strategy (CARSHOP-114 / CARSHOP-116 / CARSHOP-147)

Decision by `architect`, updated in `CARSHOP-116` to reflect the actual
state after integration with the `Work`s API:

| Page | Rendering today | Server/Client | Cache/revalidation |
|---|---|---|---|
| Home (`app/(public)/page.tsx`) | ISR — real fetch via `getWorks()` (`lib/api/works.ts`, `GET /works`), updated in `CARSHOP-144` | Server Component (all sections; no `'use client'`) | Same source/cache as `getWorks()` (`revalidate` 3600s, `tags: ['works']`). Selection (`selectHomeWorks`): only works with a cover image, in API order; hero = first, "Our Work" = next 3. Silent degradation: on API error or no works with cover, `console.error` (error only), typographic Hero and "Our Work" omitted — no toast, no empty-state message |
| About (`app/(public)/about/page.tsx`) | ISR — real fetch via `getWorks()` (`GET /works`), updated in `CARSHOP-147` (ADR-010 deviation approved by user in CARSHOP-147) | Server Component (no `'use client'`) | Same source/cache as `getWorks()` (`revalidate` 3600s, `tags: ['works']`). Optional photo (`selectAboutImage`): first work, in API order, with a resolvable image (`resolvePreviewImage`), rendered with `preload`. Silent degradation: on API error or no images, `console.error` (error only) and a typographic page — no toast, no empty-state message |
| Services (`app/(public)/services/page.tsx`) | ISR — real fetch via `getWorks()` (`GET /works`), updated in `CARSHOP-147` (ADR-010 deviation approved by user in CARSHOP-147) | Server Component (`ServiceCategoryRow` is also a Server Component; no `'use client'`) | Same source/cache as `getWorks()` (`revalidate` 3600s, `tags: ['works']`). Services = real work categories (`groupWorksByCategory`): key = `category` NFC-normalized, trimmed, whitespace collapsed and lower-cased (`pt-BR`), no stemming/synonyms, accents preserved; label = first occurrence as sent by the API; empty categories discarded; order = first appearance in API order; up to `SERVICE_PROJECT_LINKS_LIMIT` (4) project links per category; `preload` only on the first image of the page. Silent degradation: on API error, `console.error` and the page keeps header + CTAs without the category list |
| Portfolio — listing (`app/(public)/portfolio/page.tsx`) | ISR — real fetch via `getWorks()` (`lib/api/works.ts`, `GET /works`); editorial layout updated in `CARSHOP-145` | Server Component (only `error.tsx` and `ErrorToast` are Client Components). No `loading.tsx` at `app/(public)/portfolio/`: a segment-level loading boundary there also wraps `/portfolio/[slug]`, streams before `notFound()` and turns unknown slugs into soft-404s (HTTP 200) — rejected in `CARSHOP-145` | `revalidate: WORKS_REVALIDATE_SECONDS` (3600s/1h) + `tags: ['works']` on Next's native `fetch` |
| Project Details (`app/(public)/portfolio/[slug]/page.tsx`) | ISR — `generateStaticParams()` via `getWorks()` (`GET /works`); body and `generateMetadata` via `getWorkBySlug(slug)` → `GET /works/{slug}` (`CARSHOP-146`). A backend `404` returns `undefined` → `notFound()` → the segment's `not-found.tsx` (real HTTP 404; Next does not store 404 responses in the Data Cache); any other failure propagates to the segment's `error.tsx`, which recovers with `retry()`. No `loading.tsx`/`Suspense` in or above this segment (it would stream before `notFound()` and produce soft-404s) | Server Component (async `generateMetadata`); Client Components limited to `ProjectGallery`, `GalleryLightbox`, `CommentForm`, `ErrorToast` and `error.tsx` | `revalidate: WORKS_REVALIDATE_SECONDS` (3600s) + `tags: ['works']`, retry with backoff + per-attempt timeout; per-request dedupe between `generateMetadata` and the page via `React.cache()` (native `fetch` memoization is disabled because the request carries an `AbortSignal`) |
| Contact (`app/(public)/contact/page.tsx`) | Static, updated in `CARSHOP-147` | Server Component; the future form must be a Client Component isolated at the smallest boundary (not the whole page); a future `BusinessInfo` block only when confirmed business data exists | No backend data. Social links come from server-side env (`getSocialLinks()` in `lib/social-links.ts`, `server-only`), resolved at build time; each network is rendered only when configured. No form, no endpoint |
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
- `alternates.canonical` is defined on the institutional pages
  (About/Services/Contact) and on Portfolio and, on Project Details, derived
  from the `slug` received in `generateMetadata` — never a fixed sample
  value.
- `app/robots.ts` and `app/sitemap.ts` (Next.js Metadata Files API) are
  the source of truth for crawling; `/admin` is always excluded from
  both. `app/sitemap.ts` includes, besides the static routes, one entry
  per real published `Work` (`/portfolio/[slug]`, `lastModified` based
  on `work.updatedAt`), obtained via `getWorks()` (`lib/api/works.ts`).
