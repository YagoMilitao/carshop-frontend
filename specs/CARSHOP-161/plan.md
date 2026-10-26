# CARSHOP-161 — Implementation plan: Public Home renders the Admin-selected main (hero) image

Task classified as **NON-TRIVIAL** by the `spec-writer`
(`specs/CARSHOP-161/spec.md`). This plan faithfully persists the `architect`
decision and the user-validated decisions, translating them into actionable,
verifiable steps for the `developer`. No new architectural decision is
introduced here.

No Figma: the authoritative visual source is `docs/design/*` plus the
CARSHOP-144 hero direction already implemented. CARSHOP-162 (single-page Home
consolidation) is **out of scope — do not pre-implement**.

## User decisions (binding)

1. **Fallback**: when `GET /home-image` returns `{ image: null }` or fails,
   keep the current behavior (first work with a cover, via `selectHomeWorks`).
   The typographic-only hero is used only when no work has a cover.
2. **Caption**: resolve the source work by `workId` from the `getWorks()` list
   already fetched by the page; render caption/link only when the work is
   found. No new endpoint.

## Contract consumed (CARSHOP-159, verified in the spec)

- `GET /home-image` — public, no auth, no params →
  `200 { image: HomeImage | null }`.
- `HomeImage = { workId: string; imageId: string; url: string; alt: string }`
  (`alt` may be empty; no width/height; no slug/title/category).
- Errors: `429` documented; `500` possible. Any non-`200` or network failure
  is a recoverable error.

Do not invent endpoints or fields.

## Architect decision (source of truth — do not reinterpret)

### a) Server data access

- **New** `lib/api/home-image.server.ts`: `import "server-only"`, re-exports
  the types from `lib/api/home-image.ts` (mirrors the `auth.ts` /
  `auth.server.ts` precedent). Contains:
  - `export const HOME_IMAGE_REVALIDATE_SECONDS = 300` (safety net; the Home
    ISR window effectively becomes 300s — accepted);
  - `export const HOME_IMAGE_REQUEST_TIMEOUT_MS = 5_000`;
  - `export const HOME_IMAGE_RETRY_OPTIONS = { retries: 1, baseDelayMs: 500 }`
    used with `withRetryBackoff`;
  - `export async function getHomeImage(): Promise<HomeImage | null>`:
    native `fetch(`${serverEnv.apiUrl}/home-image`, { signal, next: { revalidate: HOME_IMAGE_REVALIDATE_SECONDS, tags: [HOME_IMAGE_TAG, "works"] } })`;
    non-ok → `new HttpError(message, status)`; `200` →
    `parseHomeImageResponse(await response.json())`; a new `AbortController`
    per attempt with the timeout cleared in `finally` (same as `getWorks`).
- In `lib/api/home-image.ts` (**no** `server-only`, stays importable by the
  admin client code):
  - `export const HOME_IMAGE_TAG = "home-image"`;
  - `export function parseHomeImageResponse(value: unknown): HomeImage | null`
    — returns a `HomeImage` only if `value.image` is an object with string
    `workId`, `imageId`, `url`, `alt`; otherwise `null` (a malformed `200`
    degrades to the fallback). Narrow without `any`/unsafe casts.
- **Deliberate deviation from ADR-019 default retry budget (4)**: this is
  secondary, runtime-degradable data on the Home critical path, the Data Cache
  does not cache non-`200` responses, and the full budget could add ~7.5s per
  failing render. The retry utility, `HttpError` and error classification are
  unchanged. Document this rationale in a code comment next to
  `HOME_IMAGE_RETRY_OPTIONS`.
- **No `React.cache()`** (single caller). Add a comment stating that a second
  caller (e.g. CARSHOP-162 or `generateMetadata`) must wrap it.

### b) Page composition — `app/(public)/page.tsx`

- `Promise.allSettled([getWorks(), getHomeImage()])`.
- Separate `console.error` per rejection; works → `[]`, homeImage → `null`;
  no toast. Home never breaks.
- `selectHomeWorks(works, homeImage)`.

### Selection — `app/(public)/_lib/select-home-works.ts`

- Signature:
  `selectHomeWorks(works: readonly Work[], homeImage: HomeImage | null = null): HomeWorksSelection`.
- New types:
  - `HomeHeroImage = Pick<WorkImage, "url" | "alt">`;
  - `HomeHeroContent = { image: HomeHeroImage; work: Work | null }`;
  - `HomeWorksSelection = { hero: HomeHeroContent | null; featured: HomeWork[] }`;
  - `HomeWork` unchanged.
- Rules:
  1. `configured = homeImage && isAllowedRemoteImageUrl(homeImage.url) ? homeImage : null`;
  2. if `configured`: `hero = { image: { url, alt }, work: works.find((w) => w.id === configured.workId) ?? null }`;
     `featured` = works with cover **excluding** `configured.workId`,
     `.slice(0, 3)`;
  3. otherwise current behavior: first cover work as `{ image, work }`,
     `featured` = `.slice(1, 4)`; no cover work → `hero: null` (typographic).

### c) Hero rendering

- `components/gallery/work-image-thumb.tsx`: widen the prop type only to
  `image: Pick<WorkImage, "url" | "alt">`. No behavior change.
- `app/(public)/_components/home-hero.tsx`:
  - props `{ hero: HomeHeroContent | null }`;
  - switch `priority` → `preload` (Next 16.3 deprecation; CARSHOP-147
    single-preload pattern; **never both**);
  - keep `sizes="(min-width: 1280px) 660px, (min-width: 1024px) 55vw, 100vw"`,
    `aspect-4/3`, `fill`, `object-cover` centered;
  - alt: `fallbackAlt={hero.work?.title ?? ""}` → effective cascade is
    `image.alt`, else work title, else `""` (decorative, per
    `docs/design/imagery.md`). Never invent a description;
  - render `figure` + `figcaption` (category + link to `/portfolio/{slug}`)
    **only when `hero.work` exists**; otherwise a plain `div` with the same
    layout classes;
  - two-column layout and CARSHOP-144 copy/visual direction unchanged;
  - update the hero source comment to describe the new source/fallback.

### d) Featured works

- Exclude the configured image's source work (by `workId`); the "hero never
  repeated" invariant is preserved. No change when no image is configured.
- `FeaturedWorks` component is not modified.

### e) Remote host allowlist

- **New** pure helper `app/(public)/_lib/is-allowed-remote-image-url.ts`:
  `isAllowedRemoteImageUrl(url: string): boolean` — `true` only if
  `new URL(url)` parses (try/catch), protocol is `https:`, and hostname is
  exactly `res.cloudinary.com`.
- Comment stating it must mirror `next.config.mjs` `images.remotePatterns`.
  A reciprocal comment in `next.config.mjs` is optional — add it only if the
  developer judges it trivial (comment on both sides mitigates drift). No
  other change to `next.config.mjs`.
- Disallowed URL → treated as `null` → fallback. No new hosts, no
  Cloudinary-specific transforms.

### f) Cache invalidation from Admin

- `app/(admin)/admin/actions.ts`: add
  `export async function revalidateHomeImageTag(): Promise<void> { updateTag(HOME_IMAGE_TAG); }`
  (cache only).
- `app/(admin)/admin/(protected)/imagem-da-home/_components/home-image-settings.tsx`,
  mutation `onSuccess` (around lines 57–62), **after** `setQueryData`:
  `void revalidateHomeImageTag().catch((error) => console.error("Falha ao revalidar a imagem da Home:", error));`
  - fire-and-forget; no change to pending/toast/focus UX; no
    `router.refresh()`;
  - update the "Ponto de extensão para CARSHOP-161" comment.
- Work delete/unpublish/image delete are already covered by
  `revalidateWorksTag()` + the `"works"` tag on the home-image fetch
  (verified by the architect in `work-list-item.tsx` `syncWorks` and
  `edit-work-form.tsx`). No change there.

## Files

**New**
- `lib/api/home-image.server.ts`
- `lib/api/home-image.server.test.ts`
- `app/(public)/_lib/is-allowed-remote-image-url.ts`
- `app/(public)/_lib/is-allowed-remote-image-url.test.ts`

**Changed**
- `lib/api/home-image.ts` (+ `HOME_IMAGE_TAG`, `parseHomeImageResponse`)
- `lib/api/home-image.test.ts` (create if absent)
- `app/(public)/page.tsx` and `page.test.tsx`
- `app/(public)/_lib/select-home-works.ts` and `select-home-works.test.ts`
- `app/(public)/_components/home-hero.tsx` and `home-hero.test.tsx`
- `components/gallery/work-image-thumb.tsx` (type only)
- `app/(admin)/admin/actions.ts` and `actions.test.ts`
- `app/(admin)/admin/(protected)/imagem-da-home/_components/home-image-settings.tsx`
  and `home-image-settings.test.tsx`
- `next.config.mjs` — optional reciprocal comment only

**Do not change**
- `FeaturedWorks`, `lib/api/home-image.client.ts`, `lib/api/works*.ts`,
  retry utility / `HttpError`, `images.remotePatterns`, any backend code.

(Confirm exact paths and test file names in the repository before editing.)

## Implementation steps (ordered)

Each step lists what must be verifiable at its end.

### Phase 0 — Preconditions
1. Confirm branch `feat/CARSHOP-161` (never work on `master`).
2. Confirm in `package.json` that `next` (with `preload` on `next/image` and
   `updateTag`), `server-only`, and the testing stack are installed. No new
   dependency is expected; if anything is missing, **stop and report as a
   blocker**.
3. Re-read `lib/api/works.ts`, `lib/api/auth.server.ts`, the retry utility
   (`withRetryBackoff`) and `HttpError` to mirror conventions exactly.

### Phase 1 — Data layer
1. `lib/api/home-image.ts`: add `HOME_IMAGE_TAG` and `parseHomeImageResponse`.
2. Create `lib/api/home-image.server.ts` with constants, retry comment
   (ADR-019 deviation), "no `React.cache()`" comment, and `getHomeImage`.
3. Tests:
   - `lib/api/home-image.test.ts`: `parseHomeImageResponse` valid / `null`
     image / missing field / non-string field / non-object value.
   - `lib/api/home-image.server.test.ts` (`vi.mock("server-only", () => ({}))`
     like `works.test.ts`): configured image (assert URL, `next.tags`,
     `revalidate`); `{ image: null }` → `null`; malformed → `null`; `429` and
     `500` → `HttpError` after exactly 2 attempts (fake timers); network
     rejection → throws after retry; `404` → throws without retry; timeout
     aborts past 5000ms.

Verifiable: `npm run test -- lib/api/home-image` green; `npm run typecheck`.

### Phase 2 — Pure selection logic
1. Create `is-allowed-remote-image-url.ts` (+ mirroring comment).
2. Extend `select-home-works.ts` with the new types and rules.
3. Tests:
   - `is-allowed-remote-image-url.test.ts`: https Cloudinary → true; http
     Cloudinary → false; other host → false; lookalike
     `res.cloudinary.com.evil.com` → false; invalid string → false.
   - `select-home-works.test.ts`: configured + resolved work (featured
     excludes it and starts at index 0); configured with unresolved work →
     `work: null`; configured work without a cover; disallowed host →
     fallback; `null` → current behavior (existing cases adapted to the new
     hero shape).

### Phase 3 — Hero component
1. Widen `WorkImageThumb` prop type.
2. Update `HomeHero` (props, `preload`, alt cascade, conditional
   `figure`/`figcaption`, comment).
3. Tests:
   - `home-hero.test.tsx`: image not lazy (preload); same `sizes`; alt cascade
     (use `container.querySelector("img")` for `alt=""`); no
     figure/caption when `work` is `null`; typographic when `hero` is `null`.
   - `work-image-thumb.test.tsx` must still pass unchanged.

### Phase 4 — Page composition
1. Update `app/(public)/page.tsx` with `Promise.allSettled`, per-rejection
   `console.error`, and `selectHomeWorks(works, homeImage)`.
2. `page.test.tsx` (mock `@/lib/api/home-image.server`): configured hero +
   resolved caption link; no featured duplicate; `null` → first cover work;
   `getHomeImage` rejects → fallback + `console.error`, no toast; both reject;
   works rejects + image configured → image hero, no caption, no "Our Work";
   disallowed host → fallback.

### Phase 5 — Admin invalidation
1. Add `revalidateHomeImageTag` to `app/(admin)/admin/actions.ts`.
2. Call it fire-and-forget in `home-image-settings.tsx` `onSuccess` after
   `setQueryData`; update the extension-point comment.
3. Tests:
   - `actions.test.ts`: `revalidateHomeImageTag` → `updateTag("home-image")`.
   - `home-image-settings.test.tsx` (mock admin actions): called once after a
     successful save; not called on error; a rejected action still shows the
     success toast and no save error.
4. Optional: reciprocal comment in `next.config.mjs` (only if trivial).

### Phase 6 — Validation
1. `npm run lint`
2. `npm run typecheck`
3. `npm run test`
4. `npm run test:coverage` — **≥ 80%** on new/changed code.
5. `npm run build`
6. Runtime validation (mandatory before reporting done):
   - start the backend `carshop-backend` (with `GET /home-image` available);
   - start the frontend on a **dedicated port** (e.g. `next dev -p <free port>`,
     not 3000). **Never kill the user's dev server** — no `pkill "next dev"`;
     kill only the PID of the process you started;
   - Home with a configured image: hero shows it, caption/link when the work
     resolves, the source work absent from "Our Work";
   - Home with `{ image: null }`: first cover work as hero (current behavior);
   - change the image in `/admin/imagem-da-home` and confirm the Home reflects
     it without redeploy;
   - check mobile/tablet/desktop layout (no CLS, aspect 4:3) and accessible
     alt behavior.
7. **No commits** unless explicitly requested by the user.

### Phase 7 — Post-review: recover from an unavailable remote asset

This phase addresses the review finding that an allowed Cloudinary URL can
still return `404` or fail in the browser. It does not change the backend
contract, cache strategy, or primary server-side selection.

1. Keep `HomePage` and `HomeHero` as Server Components. Add a route-local
   Client Component at the smallest boundary inside the Hero, responsible only
   for the responsive grid, current media/caption and `next/image` `onError`.
   Pass the server-rendered headline/copy/CTAs as `children`; do not clientify
   `PageSection`, `HomeCtaActions`, `Button`, `FeaturedWorks`, or the page.
2. `HomeHero` converts the primary `hero` and the cover images already present
   in `featured` into narrow, serializable media candidates (image URL/alt plus
   optional real caption data). Reuse `isAllowedRemoteImageUrl` for every
   candidate and deduplicate by URL while preserving order.
3. The client boundary renders the primary candidate first. On a resource
   error, advance through eligible covers in order; caption/link/alt always
   follow the active candidate. When all candidates fail, remove media,
   caption and link and switch to the existing typographic Hero layout.
4. Only the primary candidate uses `preload`. Candidates activated after an
   error use `loading="eager"`; keep `fill`, the existing `sizes`,
   `aspect-4/3`, and `object-cover`. Key the rendered image by URL and reset the
   interactive boundary when the candidate URL list changes after navigation
   or revalidation. Preserve the media container while switching candidates so
   those retries do not cause layout shift.
5. Add focused tests for: primary error -> first eligible cover; caption/link/
   alt update; successive errors; duplicate or disallowed URLs skipped;
   exhaustion -> typographic Hero with headline/CTAs intact; configured image
   without a resolved work; `preload` only on the primary and eager loading on
   fallbacks. Cover an error observed before hydration if the implementation
   includes the architect-recommended completed-image/ref guard.
6. Update the Home row in `docs/rules/rendering.md`: the page remains ISR and a
   Server Component, with one isolated Client island in the Hero solely for
   resource-load recovery.

Verifiable: focused Hero tests pass, then repeat Phase 6 validation. Runtime
validation must include a configured allowed URL whose resource returns an
error and confirm both cover fallback and eventual typographic degradation.

## DoD → steps mapping

| Spec scope / DoD item | Phase / step |
| --- | --- |
| Home reads real `GET /home-image`; configured image is primary | Phases 1, 2, 4 |
| Admin change reflected without redeploy | Phase 5 + tags/revalidate (Phase 1) |
| Safe fallback for `null`/request failure/invalid host/unavailable asset | Phases 1 (parse), 2 (allowlist, fallback), 4, 7 |
| `next/image` preload, `sizes`, stable aspect ratio | Phase 3 |
| Alt only from real data | Phase 3 |
| Featured de-duplication | Phase 2 |
| SEO/Server Component/CARSHOP-144 direction preserved; responsive, accessible | Phases 3, 4, 6.6 |
| Lint, typecheck, build, tests, coverage ≥ 80%, dev server | Phase 6 |

## Visible behavior notes

- When the configured image's work is not resolved in the works list (e.g.
  works fetch failed or caches briefly disagree): no caption, and alt falls
  back to `""` when `image.alt` is empty (per user decision 2).
- The first cover work may now appear in "Our Work", because the configured
  work is excluded instead.

## Risks

1. Allowlist duplication drift between `isAllowedRemoteImageUrl` and
   `next.config.mjs` `remotePatterns` (mitigated by comments).
2. `{ image: null }` may be cached up to 300s if the configuration changes
   outside the frontend (accepted safety-net window).
3. Works cache (3600s) vs home-image cache may briefly disagree; this only
   affects caption resolution (safe degrade).
4. The hero type change touches existing tests (`home-hero`,
   `select-home-works`, `page`).

## Rejected alternatives (do not reintroduce)

- Mapping `HomeImage` into a fake `WorkImage`.
- A separate `selectHomeHero` function.
- Putting the fetch in `home-image.ts` with `server-only` (would break admin
  client imports of the types/tag).
- Full ADR-019 retry budget.
- Awaiting the Server Action in `onSuccess`.

## Points to confirm with the user

- No blocker was flagged by the `architect`. If Phase 0 finds a missing
  dependency or API (`preload`, `updateTag`, `server-only`), stop and confirm
  with the user before proceeding.

## Security

No secret, token, or real `.env` value is needed or cited in this plan.
`serverEnv.apiUrl` is consumed through the existing server env module; never
log its value. Admin credentials used during runtime validation must not be
recorded in logs, reports, or commits.
