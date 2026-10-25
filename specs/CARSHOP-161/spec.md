# CARSHOP-161 — Public Home: render the Admin-selected main (hero) image

## Reference

Notion task: CARSHOP-161 ("Renderizar na Home a imagem principal configurada
pelo Admin"). Full Description, DoD and Technical Notes live in the task; only
the essentials are summarized here.

Feature · Priority High · Sprint 6 · Components: Public UI, Images · 3 points ·
Branch `feat/CARSHOP-161` · **No Figma** (authoritative visual source:
`docs/design/*` + the CARSHOP-144 hero direction already implemented).

Related:

- CARSHOP-159 (backend, Done) — defines `GET /home-image`.
- CARSHOP-160 (admin selection, merged PR #40) — types/services reused here.
- CARSHOP-144 (Home redesign, Done) — current hero; visual direction preserved.
- CARSHOP-162 (To Do) — single-page Home consolidation. **Out of scope; do not
  pre-implement.**

Goal: the public Home hero shows the image chosen in Admin, read from the real
public endpoint, with changes reflected without redeploy and a safe fallback.

## Backend contract (verified)

Verified in `carshop-backend/docs/api-contract.md` ("Home Image") and in the
frontend types created by CARSHOP-160 (`lib/api/home-image.ts`).

`GET /home-image` — public, no auth, no params.

```ts
type HomeImageResponse = { image: HomeImage | null };
type HomeImage = { workId: string; imageId: string; url: string; alt: string };
```

- `200` both with a configured image and with `{ "image": null }` (nothing
  configured, image deleted, work deleted/soft-deleted, or work in `draft`).
  Eligibility is re-evaluated on every read.
- `alt` may be an empty string.
- **No width/height** in the response; `publicId` is never exposed.
- Documented error: `429`. Swagger follow-up from CARSHOP-159 notes `500` is
  also possible; the frontend must treat any non-`200`/network failure as a
  recoverable error.
- No `slug`, `title`, or `category` of the source work is returned — only
  `workId`.

## Current repository state

- Home page: `app/(public)/page.tsx` (async Server Component). Fetches
  `getWorks()` (`lib/api/works.ts`, server-only native `fetch`,
  `revalidate: 3600`, `tags: ["works"]`, retry/backoff + 10s timeout), degrades
  silently on failure, then `selectHomeWorks(works)`.
- Hero component: `app/(public)/_components/home-hero.tsx`. Receives
  `hero: HomeWork | null` (`{ work, image: WorkImage }`) and renders
  `WorkImageThumb` (`components/gallery/work-image-thumb.tsx`, wrapper of
  `next/image`, typed to `WorkImage`, `alt={image.alt || fallbackAlt}`) with
  `priority`, `sizes="(min-width: 1280px) 660px, (min-width: 1024px) 55vw,
  100vw"`, `aspect-4/3`, plus a `figcaption` with the work category and a link
  to `/portfolio/{slug}`. When `hero` is `null`, the hero is typographic only
  (single-column layout).
- Hero selection: `app/(public)/_lib/select-home-works.ts` — first work with a
  cover image becomes the hero; the next up to 3 become "Our Work"
  (`FeaturedWorks`); the hero is never repeated in featured.
- `lib/api/home-image.ts`: types only (comment explicitly defers the
  server-side fetch to CARSHOP-161).
- `lib/api/home-image.client.ts`: Axios (client-only, ADR-001) `getHomeImage`,
  `setHomeImage`, `homeImageQueryKey`. Not usable from Server Components.
- Admin save (`imagem-da-home/_components/home-image-settings.tsx`) only
  updates the TanStack Query cache; it **does not invalidate any Next Data
  Cache tag**.
- `app/(admin)/admin/actions.ts`: Server Actions `revalidateWorksTag()`
  (`updateTag("works")`) and `revalidateCommentsTag()`; `updateTag` is used
  because the installed Next version changed `revalidateTag` semantics.
  `revalidateWorksTag` is called after work create/edit/delete
  (`work-list-item.tsx`, `create-work-form.tsx`, `edit-work-form.tsx`).
- `next.config.mjs`: `images.remotePatterns` only allows
  `https://res.cloudinary.com`.

## Conflicts with the Notion task (flagged to the user)

1. **"Eliminate hardcoded image" does not match the repository.** The hero is
   not hardcoded: it is derived dynamically from the first published work with
   a cover (`selectHomeWorks`). The real change is replacing that derived
   source with the Admin configuration as the primary source. Scope is
   otherwise unaffected.
2. **Hero caption depends on data the endpoint does not provide.** The current
   `figcaption` shows the work category/title and links to the project, but
   `GET /home-image` only returns `workId`. Options (architect to decide, user
   to confirm if it changes the visible UI): (a) resolve the work by `workId`
   from the `getWorks()` list already fetched by the page, rendering the
   caption only when found; (b) drop the caption for the configured image.
   The frontend must not invent a new endpoint.
3. **Fallback semantics are undefined.** When `image` is `null` or the request
   fails, the DoD asks for a "safe visual fallback" but not which one:
   (a) keep today's behavior (first work with cover), or (b) typographic-only
   hero (already supported by `HomeHero`). Option (a) means an Admin "no
   selection" still shows an image; option (b) changes today's Home when
   nothing is configured. Needs architect decision / user confirmation.

## Scope

1. Server-side data access for `GET /home-image` (native `fetch`, server-only,
   same conventions as `lib/api/works.ts`: timeout, retry/backoff, `HttpError`),
   returning `HomeImage | null`; reuse the existing `HomeImage` types.
2. Home page fetches works and home image in parallel; a home-image failure
   must never break the Home (silent degradation, like works).
3. `HomeHero` renders the configured image as primary source, via `next/image`
   with `priority`, suitable `sizes`, and a fixed aspect-ratio container
   (no dimensions in the contract → `fill`/aspect-ratio, not intrinsic
   width/height) to avoid CLS. `WorkImageThumb` is typed to `WorkImage`; the
   architect decides whether to adapt/generalize it or map `HomeImage`.
4. Alt: use `image.alt`; when empty, fall back only to real data (e.g. work
   title if resolved) or decorative treatment decided by the architect —
   never an invented description.
5. Cache/revalidation so an Admin change is reflected without deploy and is
   never stale indefinitely (architect decides), considering:
   - a dedicated cache tag for the home-image fetch, invalidated by a new
     Server Action called after a successful `PATCH /admin/home-image` in the
     CARSHOP-160 admin screen (touches admin code minimally);
   - work delete/unpublish/image delete also change `GET /home-image`
     (→ `null`), so the fetch should also be invalidated by the existing
     `"works"` invalidation (e.g. tag both), plus a bounded `revalidate`
     time as safety net;
   - image deletion (`images.client.ts`) currently may not call
     `revalidateWorksTag` — verify.
6. Featured works interaction: decide whether the work behind the configured
   image is excluded from "Our Work" (today the hero work is never repeated).
7. Remote host: the backend `url` is a storage URL; `next/image` only allows
   `res.cloudinary.com`. Verify real URLs match; if a non-allowed host is
   possible, handle safely (fallback) rather than crashing the Home. Do not
   couple the Home to Cloudinary-specific transforms.
8. Tests (Vitest/RTL): server fetch (success, `null`, `429`/`500`/network,
   timeout), page composition (configured / null / failure), hero rendering
   (alt, priority, sizes, fallback), new Server Action, admin save calling
   it. Coverage ≥ 80% on new/changed code.

## Out of scope

- Single-page Home consolidation (CARSHOP-162).
- Hero redesign beyond what is strictly required (CARSHOP-144 direction kept).
- Any backend change or new endpoint; Route Handlers proxying the backend.
- Changes to the Admin selection UX beyond triggering cache invalidation.

## Acceptance (from DoD, condensed)

- Home reads the real `GET /home-image`; configured image is the primary hero
  source.
- Admin change reflects on Home per the defined cache strategy, no redeploy.
- Safe fallback for `null`, request failure, or unavailable asset; no
  significant layout shift; Home never breaks.
- `next/image` with `priority`, `sizes`, stable aspect ratio (LCP).
- Alt only from real data.
- SEO/rendering (Server Component, metadata) and CARSHOP-144 visual direction
  preserved; responsive (mobile/tablet/desktop) and accessible.
- `lint`, `typecheck`, `build`, and relevant tests pass; dev server validation.

## Size classification

**NON-TRIVIAL** — touches the server data layer, the Home page, the hero
component (and possibly `WorkImageThumb` / `selectHomeWorks`), Admin Server
Actions and the CARSHOP-160 admin save flow, and requires architectural
decisions (cache/revalidation strategy, fallback semantics, caption data
source, featured de-duplication, image host handling).

Next agents:

- `knowledge-reader` — recommended (CARSHOP-144/160 notes, `updateTag`
  caching knowledge in Obsidian).
- `architect` — **required** (items 3–7 of Scope and the three conflicts).
- `plan-writer` — **required** (persist `specs/CARSHOP-161/plan.md`).
