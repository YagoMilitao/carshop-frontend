# CARSHOP-170 — Public Home: approved comments as social proof (`#reviews`)

## Reference

Notion task: CARSHOP-170 ("Integrar reviews reais aprovados como prova social
na Home"). Full Description, DoD and Technical Notes live in the task; only
the essentials are summarized here.

Feature · Priority High · Sprint 6 · Components: Public UI, Comments · Epic:
Frontend Público · 3 points · Branch `feat/CARSHOP-170` · **No Figma**
(authoritative visual source: `docs/design/*` + current Home direction from
CARSHOP-144/161).

Goal: a Home section `#reviews` built **exclusively** from real `APPROVED`
comments of the moderated comment system. Nothing invented (no reviews,
ratings, names or aggregate numbers).

Related:

- CARSHOP-146 — project page that already lists approved comments per work.
- CARSHOP-35 — admin moderation (approve/edit/delete) and per-work cache
  invalidation.
- CARSHOP-161 — current Home composition (`getWorks` + `getHomeImage`,
  `Promise.allSettled`, silent degradation).
- CARSHOP-162 — single-page Home consolidation (section anchors). Do not
  pre-implement; only the `#reviews` anchor is in scope here.

## Backend contract

**Verified** against the backend contract documentation
(`carshop-backend` `docs/api-contract.md`) before the architecture phase.
Result: `GET /works/{workId}/comments` is the **only** public read of
comments; there is **no** public endpoint listing approved comments across
all works. The admin listing requires admin auth and must not be used by the
public Home.

| Endpoint | Access | Notes |
| --- | --- | --- |
| `GET /works/{workId}/comments` | public | only `APPROVED` (backend filter); already consumed by `getWorkComments` in `lib/api/comments.ts` (server-only `fetch`, `revalidate: 300`, tag `work-comments-{workId}`) |
| `POST /works/{workId}/comments` | public | creates `PENDING` |
| `GET /admin/comments?status=&page=&limit=` | admin (Bearer) | paginated `{ items, page, limit, total, totalPages }` — not usable from the public Home |

`Comment` = `{ id, workId, authorName, content, status, createdAt, updatedAt }`.
**No rating field, no email, no vehicle field.**

## Current repository state

- Home: `app/(public)/page.tsx` (async Server Component) → `HomeHero`,
  `FeaturedWorks` (only when there are works), `FinalCta`. No section has an
  `id` anchor today.
- `lib/api/comments.ts`: server-side `getWorkComments(workId)`, types,
  `workCommentsTag`, `WORK_COMMENTS_REVALIDATE_SECONDS`.
- `lib/api/comments.client.ts`: Axios (client-only, ADR-001) mutations and
  admin listing — not usable on the public Home.
- `app/(admin)/admin/actions.ts`: `revalidateCommentsTag(workId)` called after
  moderation → invalidates `work-comments-{workId}`.
- `app/(public)/portfolio/[slug]/_components/project-comments.tsx`: renders
  approved comments (author, `<time>`, plain-text content, no quotes/stars/
  counts) bundled with `CommentForm` — reusable only partially (list markup /
  date formatting), not as-is.

## Conflicts / dependencies — resolved

All items below were flagged to the user and are now **resolved** by
user-approved decisions (details in `specs/CARSHOP-170/plan.md`).

1. **No public endpoint lists approved comments across all works**
   (confirmed by contract verification). **Resolved — user approved option
   (b): bounded fan-out over the existing contract.** The Home calls
   `getWorkComments` for the first 6 works already fetched by `getWorks()`,
   merges, filters, sorts by `createdAt` desc and caps at 3. Reuses existing
   per-work tags (moderation already invalidates them). Accepted trade-offs:
   N requests per regeneration (rate limit `429`), "most recent" relative to
   the sampled works. A future public backend endpoint remains a possible
   follow-up dependency; none is invented now.
2. **Personal data.** **Resolved — "first name + last initial"** (e.g.
   `Yago M.`). The raw `authorName` never reaches the UI component; `workId`,
   `id`, `status`, `updatedAt` are not rendered.
3. **No rating in the data.** No stars, averages or "N reviews" counters.
   Project context comes only from real data (work title/slug resolved from
   the `getWorks()` list by `workId`).
4. **Placeholders.** The DoD prevails: no placeholders in any state.
5. **Empty-state semantics.** **Resolved — omit the section entirely** (no
   `#reviews` anchor, no editorial fallback copy) when there are no approved
   comments or on failure.

Additional user decision: section heading copy is **`Reviews`**.

## Scope

1. Server-side data access for approved comments for the Home via bounded
   fan-out over `GET /works/{workId}/comments` (no new Axios usage;
   server-only `fetch`, same conventions as `lib/api/comments.ts`:
   retry/backoff, `HttpError`, ISR + tags so moderation reflects on the Home).
2. Home page fetches reviews after works/home image; failure degrades
   silently and never breaks the rest of the page.
3. New `#reviews` section (Server Component) between `FeaturedWorks` and
   `FinalCta`, heading `Reviews`, at most 3 items, plain-text content (never
   HTML), `<time dateTime>`, restrained testimonial treatment per
   `docs/design/` (open layout, subtle dividers, readable width), English copy
   consistent with the public site.
4. Only `APPROVED` comments rendered (defensive filter on `status` even though
   the backend already filters).
5. Real context per comment (work title/link) resolved from real data.
6. Tests (Vitest/RTL): data access (success, empty, errors/429/network, cap,
   ordering, non-APPROVED filtered), section rendering (content as text/XSS,
   no rating/counter, PII rule, empty state), Home composition (with reviews /
   empty / failure). Coverage ≥ 80% on new/changed code.

## Out of scope

- Any backend change or invented endpoint; Route Handlers proxying the
  backend; using admin endpoints from public pages.
- Ratings, aggregate scores, external review sources.
- Comment form on the Home; changes to moderation UX.
- CARSHOP-162 single-page consolidation (other anchors/navigation).

## Acceptance (from DoD, condensed)

- `#reviews` present when approved comments are available; only real
  `APPROVED` comments; nothing invented.
- Adequate empty state without fictitious content (section omitted); bounded
  quantity.
- No unnecessary personal data exposed.
- Loading/error/fallback never break the Home.
- Responsive, accessible; `lint`, `typecheck`, `build`, tests pass; dev server
  validation.

## Risks / known limitations

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

## Size classification

**NON-TRIVIAL** — requires an architectural decision on the data source,
cache/revalidation strategy, PII policy and empty-state semantics, plus a new
data-access function, a new Home section and Home composition changes.

Workflow status:

- Contract verification — done (see "Backend contract").
- `architect` — done; decisions approved by the user.
- `plan-writer` — done (`specs/CARSHOP-170/plan.md`).
- Next: `developer`.
