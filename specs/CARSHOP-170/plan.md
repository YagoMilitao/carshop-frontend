# CARSHOP-170 — Implementation plan: Public Home approved comments as social proof (`#reviews`)

Task classified as **NON-TRIVIAL** by the `spec-writer`
(`specs/CARSHOP-170/spec.md`). This plan faithfully persists the `architect`
decision and the user-approved decisions, translating them into actionable,
verifiable steps for the `developer`. No new architectural decision is
introduced here.

No Figma: the authoritative visual source is `docs/design/*` plus the current
Home direction (CARSHOP-144/161). CARSHOP-162 (single-page Home
consolidation) is **out of scope — do not pre-implement**; only the
`#reviews` anchor is in scope.

## User decisions (binding)

1. **Data source**: bounded fan-out over the **existing** public contract
   (`GET /works/{workId}/comments`). No new endpoint, no admin endpoint.
2. **Reviewer name**: "first name + last initial" (e.g. `Yago M.`). The raw
   `authorName` never reaches the UI component.
3. **Heading copy**: `Reviews`.
4. **Empty state**: omit the section entirely (no `#reviews` anchor, no
   placeholder, no editorial fallback copy).

## Contract consumed (verified)

The backend contract was verified before the architecture phase:

- `GET /works/{workId}/comments` — public, returns only `APPROVED` comments.
  It is the **only** public read of comments; there is **no** public global
  listing of approved comments.
- `GET /admin/comments` requires admin auth and **must not** be used by the
  public Home.
- `Comment = { id, workId, authorName, content, status, createdAt, updatedAt }`
  — no rating, email or vehicle field.

Do not invent endpoints or fields.

## Architect decision (source of truth — do not reinterpret)

### a) Limits

- `HOME_REVIEWS_WORKS_LIMIT = 6` — first 6 items of `works` (API order)
  already loaded by the Home; independent of `selectHomeWorks`.
- `HOME_REVIEWS_LIMIT = 3` — reviews shown.
- "Most recent" is relative to the 6 sampled works — document this in code.

### b) Data access & cache (`lib/api/comments.ts`)

- Extend `getWorkComments(workId, options?: { retry?: RetryOptions; timeoutMs?: number })`.
  - Without `options`: behavior identical to today (default retry budget, no
    timeout) — `/portfolio/[slug]` must not regress.
  - With `timeoutMs`: a new `AbortController` per attempt, timeout cleared in
    `finally` (same pattern as `getWorks` / `getHomeImage`).
  - URL, `revalidate: 300` and `tags: [workCommentsTag(id)]` unchanged — the
    Data Cache is shared with `/portfolio/[slug]`, so existing moderation
    invalidation (`app/(admin)/admin/actions.ts`) reflects on the Home with no
    admin change.
- Home constants: `HOME_REVIEWS_RETRY_OPTIONS = { retries: 1, baseDelayMs: 500, shouldRetry } as const satisfies RetryOptions` (`shouldRetry`: `5xx` + network/timeout only, never `429`);
  `HOME_REVIEWS_REQUEST_TIMEOUT_MS = 5_000`; justification comment in the
  style of `HOME_IMAGE_RETRY_OPTIONS` (`lib/api/home-image.server.ts`).

### c) Failure handling (`getHomeReviews`)

- `getHomeReviews(works)` **never rejects**: `Promise.allSettled` over the
  per-work calls; each rejection → `console.error` with only `workId` + error
  (never `authorName`/`content`); the failed work is skipped.
- All fail / no comments / `getWorks` failed (`works = []` → no fan-out) →
  `[]` → section omitted. Silent degradation (CARSHOP-161 pattern), no toast.
- `page.tsx`: after the existing `Promise.allSettled` of works/home image,
  `const reviews = await getHomeReviews(works)`.

### d) Pure selection (`selectHomeReviews`)

- Discard: `status !== "APPROVED"`; `content.trim() === ""`; unparseable
  `createdAt`; empty derived name. Dedupe by `id`.
- Sort `createdAt` desc, tiebreak `id` asc; `slice(0, HOME_REVIEWS_LIMIT)`.
- Output type:

  ```ts
  type HomeReview = {
    id: string; // React key only
    content: string;
    reviewerName: string;
    createdAt: string;
    work: { title: string; slug: string };
  };
  ```

- `work` resolved by `workId` from the already fetched works list.
  `authorName`, `workId`, `status`, `updatedAt` are not part of the type.

### e) `formatReviewerName` (pure)

1. NFC normalize; split by `/\s+/u`, drop empty tokens.
2. 0 tokens → `null` (review discarded; no "Anonymous" fallback).
3. 1 token → that token.
4. 2+ tokens → `first + " " + initial + "."`, where `initial` is the first
   letter (`/\p{L}/u`) of the **last** token (after the first) containing a
   letter, `toLocaleUpperCase("en-US")`. If no later token has a letter
   (`"Yago 123"`, `"Yago -"`) → first token only.
5. First name kept as typed.

Examples: `"Yago Militão"` → `"Yago M."`; `"  yago   de  militão "` →
`"yago M."`; `"Ana Silva-Santos"` → `"Ana S."`; `"Élise Ødegård"` →
`"Élise Ø."`.

### f) Position

`HomeHero` → `FeaturedWorks` → `HomeReviews` → `FinalCta`. `HomeReviews` is
shown even when `FeaturedWorks` is omitted.

### g) UI (no Figma; `docs/design/`)

- `PageSection spacing="standard" container="page" id="reviews" aria-labelledby="reviews-heading" className="bg-surface-warm"` (full-bleed warm surface).
- `lg`: 12 columns — heading `lg:col-span-4` top-aligned; list
  `lg:col-span-8` with reading width (`max-w-2xl`). `md`/mobile: single
  stacked column. No carousel, no horizontal scroll.
- Items separated by `divide-y divide-border`, generous vertical padding; no
  box, shadow or radius.
- Review text: `text-body-lg text-foreground whitespace-pre-line`, full text,
  no truncation. Name: `text-body font-medium`. Date:
  `text-body-sm text-muted-foreground`. Heading: `text-heading-2` (same as
  "Our Work"), copy `Reviews`.
- Forbidden: decorative quotes, stars, averages, counters, avatars, badges,
  images, motion.
- Per item: `next/link` to `/portfolio/{slug}`, text = real work title +
  `LuArrowRight` `aria-hidden`; same style as "View all projects" in
  `FeaturedWorks` (`min-h-11`, `focus-visible:ring-3 ring-focus-ring`,
  `hover:text-primary`). Accessible name = work title.
- Date: `<time dateTime={createdAt}>`, long en-US UTC (`June 5, 2026`), via
  the extracted `formatCommentDate`.

### h) Components & semantics

New Server Component `app/(public)/_components/home-reviews.tsx` (no
`"use client"`), props `reviews: readonly HomeReview[]`; returns `null` when
empty.

```
<section id="reviews" aria-labelledby="reviews-heading">   (via PageSection)
  <h2 id="reviews-heading">Reviews</h2>
  <ul><li><figure>
    <blockquote><p>{content}</p></blockquote>
    <figcaption>{reviewerName} · <time/> · <Link>{work.title} →</Link></figcaption>
  </figure></li></ul>
```

- Separator `·` is `aria-hidden` (or a visual gap).
- Content always rendered as JSX text; `dangerouslySetInnerHTML` forbidden.
- Do not reuse `ProjectComments`; no Shadcn `Card`; no generic
  `SectionHeading`.

### i) Server vs Client

All server. `get-home-reviews.ts` has `import "server-only"`. Pure functions
(`select-home-reviews.ts`, `format-reviewer-name.ts`,
`format-comment-date.ts`) are testable in isolation. No new client island,
no Axios/TanStack Query (ADR-001).

## Files to touch

| File | Change |
| --- | --- |
| `lib/api/comments.ts` | Extend `getWorkComments` with optional `{ retry, timeoutMs }` |
| `lib/api/comments.test.ts` | Timeout/abort, custom retry budget, no regression without options |
| `app/(public)/_lib/format-comment-date.ts` (new) + test | Extracted from `project-comments.tsx` |
| `app/(public)/portfolio/[slug]/_components/project-comments.tsx` | Import extracted `formatCommentDate` (no visual change) |
| `app/(public)/_lib/format-reviewer-name.ts` (new) + test | Pure name formatter |
| `app/(public)/_lib/select-home-reviews.ts` (new) + test | `HomeReview` type, limit constants, pure selection |
| `app/(public)/_lib/get-home-reviews.ts` (new, `server-only`) + test | Bounded fan-out, retry/timeout constants, never rejects |
| `app/(public)/_components/home-reviews.tsx` (new) + `home-reviews.test.tsx` | `#reviews` section |
| `app/(public)/page.tsx` + `page.test.tsx` | Compose `HomeReviews` between `FeaturedWorks` and `FinalCta` |
| `docs/rules/rendering.md` | Update Home row: fan-out, limits 6/3, retry/timeout budget, tag `work-comments-{id}`, omission without data |

## Implementation order

1. **Extract `formatCommentDate`** to `app/(public)/_lib/format-comment-date.ts`
   and switch `project-comments.tsx` to it. Run existing portfolio tests to
   confirm no regression.
2. **Extend `getWorkComments`** (optional `options`) and its tests. Confirm
   the no-options path is byte-for-byte equivalent in behavior.
3. **`formatReviewerName`** + tests.
4. **`selectHomeReviews`** (type `HomeReview`, `HOME_REVIEWS_LIMIT`,
   `HOME_REVIEWS_WORKS_LIMIT`) + tests.
5. **`getHomeReviews`** (`server-only`, `HOME_REVIEWS_RETRY_OPTIONS`,
   `HOME_REVIEWS_REQUEST_TIMEOUT_MS`, fan-out over first 6 works,
   `Promise.allSettled`, PII-free `console.error`) + tests.
6. **`HomeReviews`** Server Component + tests.
7. **Home composition** in `app/(public)/page.tsx` + `page.test.tsx`.
8. **Docs**: update the Home row in `docs/rules/rendering.md`; add a code
   comment noting that "most recent" is relative to the sampled works and
   that `#reviews` is absent without data (CARSHOP-162 impact).
9. **Validation**: `lint`, `typecheck`, `test` (coverage ≥ 80% on new/changed
   code), `build`; then dev server validation (see below).

## Required tests

- `formatReviewerName`: 1 token; 2+ tokens; spaces/tabs/newlines;
  whitespace-only → `null`; letterless trailing tokens; accents; initial
  capitalization.
- `selectHomeReviews`: discards non-`APPROVED`, empty content, invalid date,
  empty derived name, duplicates; sort desc + `id` tiebreak; limit 3; resolves
  title/slug; output has no `authorName`/`workId`/`status`.
- `getHomeReviews`: at most 6 calls; partial failure (429/404/network)
  continues; total failure → `[]`; never rejects; `console.error` without PII;
  `works = []` → no calls.
- `getWorkComments`: options timeout/abort; custom retry budget; unchanged
  behavior without options.
- `HomeReviews`: `<script>`/HTML content rendered as text; no star/counter/
  average; abbreviated name, never the full name; `<time dateTime>`; link to
  `/portfolio/{slug}` with accessible name = title; `id="reviews"` + valid
  `aria-labelledby`; empty list → `null`.
- `page`: section order (reviews between "Our Work" and CTA); `#reviews`
  absent with no data; cases with reviews, empty, partial failure, total
  failure, works failure (mock `@/lib/api/comments`).

## Dev server validation

Use a dedicated port and stop only the process started by the agent (never
kill the user's dev server). Verify:

- Home renders `#reviews` with up to 3 real approved comments, abbreviated
  names, dates and work links; responsive at mobile/`md`/`lg`.
- Approving/editing/deleting a comment in admin is reflected on the Home
  (shared Data Cache key/tag even with `signal` — risk 1 below).
- With no approved comments in the sampled works, the section and anchor are
  absent and the rest of the Home renders normally.

## Risks (from architect)

1. Data Cache key must stay shared even when `signal` is passed — validate on
   the dev server.
2. Shared server IP rate limit; `429` is not retried on the Home (see known
   limitations below); a `429` just omits that work.
3. The 6-work sample makes "most recent" relative; a future public backend
   endpoint for recent approved comments is a possible follow-up dependency
   (not invented now).
4. PII typed into the name field relies on moderation.
5. `#reviews` absent when there is no data (CARSHOP-162 impact).
6. Worst-case latency ~10.5s during ISR regeneration/build — accepted.

### Known limitations (follow-up review)

- `429` is not retried on the Home (`HOME_REVIEWS_RETRY_OPTIONS.shouldRetry`
  retries only `5xx` and network/timeout errors, once). The backend rate limit
  (100 req/IP/15min, global) is shared by every server-side fetch from the
  frontend's IP, so a retry within 500ms cannot succeed and only burns the
  budget of other SSR pages. Worst case per revalidation: 1 (`GET /works`) +
  up to 6 comment requests; a `429` omits only that work, and since the Data
  Cache does not store non-`200` responses the next ISR window tries again.
  Correct per-client counting depends on the backend's `TRUST_PROXY_HOPS`
  being configured correctly on Render (backend/infra concern, not verifiable
  from the frontend). `/portfolio/[slug]` keeps the ADR-019 default budget.
- Tag invalidation (`work-comments-{id}`) only happens via the frontend admin
  Server Actions; moderation done outside the frontend (Swagger, Postman,
  other clients) appears after up to 300s (`revalidate` TTL). Accepted.
- Pre-existing backend behavior, out of Home scope: `GET /works/{workId}/comments`
  only checks that the work is not deleted, not that it is published, so
  approved comments of a draft are readable by anyone knowing its ID. The Home
  is unaffected because public `GET /works` (without `includeDrafts`) returns
  only published, non-deleted works. Possible backend follow-up.

## Constraints

- No `any`, `as any`, `@ts-ignore`, `@ts-expect-error` or unsafe casts.
- No backend change, Route Handler proxy, or admin endpoint usage.
- No invented content, placeholders, ratings or counters.
- No secrets or `.env` values in code, tests, logs or docs.
- Do not commit unless the user explicitly asks.

## Out of scope

Same as the spec: backend changes, ratings/external reviews, comment form on
the Home, moderation UX changes, CARSHOP-162 consolidation.
