# CARSHOP-160 — Admin: select the Home main (hero) image

## Reference

Notion task: CARSHOP-160 ("Permitir selecionar no Admin a imagem principal da
Home"). Full Description, DoD and Technical Notes live in the task; only the
essentials are summarized here.

Feature · Priority High · Sprint 6 · Components: Images, Admin UI · 5 points ·
**No Figma** (authoritative visual source: `docs/design/*`, especially the
Admin sections of `visual-direction.md`, `components.md`, `spacing.md`,
`typography.md`, `colors.md`, and `imagery.md`).

Related:

- CARSHOP-159 (backend) — defines the HTTP contract consumed here.
- CARSHOP-161 — renders the hero on the public Home. **Out of scope.**
- CARSHOP-142 (Done) — design-system foundation; must be followed.
- CARSHOP-148 / CARSHOP-152 (Done) — admin shell, nav, and shared states.

Goal: give the administrator a clearly identified admin area to preview real,
eligible images and choose which one is the Home hero, persisting the choice
through the real admin endpoint, without code changes.

## Backend contract (CARSHOP-159)

Sources verified in `carshop-backend` (branch `feat/CARSHOP-159`):
`docs/api-contract.md` ("Home Image"), `src/infra/docs/home-image.swagger.ts`,
`src/infra/http/routes/home-image.routes.ts`,
`src/infra/http/routes/admin-home-image.routes.ts`.

| Operation | Auth | Request | Success | Errors |
| --- | --- | --- | --- | --- |
| `GET /home-image` | public | — | `200 { image: HomeImage \| null }` | `429` |
| `PATCH /admin/home-image` | Bearer | body `{ workId, imageId }` (strict) | `200 { image: HomeImage }` (never null) | `400`, `401`, `404`, `409`, `429`, `500` |

`HomeImage = { workId: string; imageId: string; url: string; alt: string }`
(`alt` may be empty; no width/height; `publicId` never exposed).

Key rules:

- Body is strict: extra fields (including `url`) → `400`. `workId`/`imageId`:
  1–64 chars, `^[A-Za-z0-9-]+$`.
- `404`: work not found / soft-deleted, or image not found in the work.
- `409`: work is not `published`.
- Eligibility: only images of works with `status: "published"` and not
  soft-deleted. Re-validated on every public read — if the selected image/work
  becomes ineligible, `GET /home-image` returns `{ image: null }` while the
  stored reference is kept.
- On any rejected `PATCH`, the current configuration is unchanged.

**There is no endpoint that lists eligible images.** See "Sourcing eligible
images" below.

## Current repository state (investigation)

- `lib/api/http.ts`: single Axios instance (ADR-001), used by all admin
  client services with the session Bearer token/refresh flow.
- `lib/api/works.ts` (server-only, `fetch`): `Work`, `WorkImage`
  (`id`, `url`, `publicId`, `alt`, `isCover`, `order`, ...), `WorkStatus`,
  `getWorks()`, `getCoverImage()`.
- `lib/api/works.client.ts`: `adminWorksQueryKey = ["admin","works"]`,
  `getAdminWorks()` → `GET /works?includeDrafts=true` (full list, no
  pagination), used by `admin-work-list.tsx` and `edit-work-form.tsx`.
- `lib/api/images.client.ts`: upload/delete of work images only.
- No `home-image` service, types, query key, or admin screen exist yet.
- Admin shell: `admin-nav-links.ts` lists `Dashboard`, `Trabalhos`,
  `Comentários`; its header comment forbids adding sections without an
  architecture decision.
- Shared admin states: `_components/admin-states.tsx`
  (`AdminLoadingState`, `AdminErrorState`, `AdminEmptyState`);
  `AdminPageHeader`; toasts via `sonner`; error message helper
  `getApiErrorMessage` (`lib/api/auth.client.ts`).
- Image rendering: `components/gallery/work-image-thumb.tsx` (`next/image`
  wrapper for `WorkImage`); `next.config.mjs` `remotePatterns` allows only
  `https://res.cloudinary.com`.

## Sourcing eligible images

Backend `GET /works` contract (confirmed in `docs/api-contract.md` and routes):

- No pagination, no `status` filter, no search params. Only `includeDrafts`.
- Without `includeDrafts`, it is public and returns only published,
  non-deleted works, each with its full `images[]` embedded.

Therefore the only contract-compliant way to source candidates is to load the
works list once and derive eligible images client-side
(`status === "published"` and `deletedAt === null`), either from:

- (a) the already cached admin query (`adminWorksQueryKey`, includes drafts),
  filtering to published — reuses cache shared with `/admin/trabalhos`; or
- (b) a dedicated call to `GET /works` without `includeDrafts`.

Choice between (a) and (b), and the grouping/browsing UX (e.g., grouped by
work, collapsible, client-side filter by work title), belongs to the
`architect`.

The Technical Notes ask to avoid loading all images in a single response.
**The current backend contract cannot satisfy that**: there is no paginated or
filtered listing. This is recorded as a **dependency/risk**, not solved by
inventing endpoints:

- Acceptable for the current data volume (small portfolio), and the payload is
  the same one `/admin/trabalhos` already loads.
- Mitigations allowed on the frontend: lazy image loading (`next/image`
  default), appropriate `sizes` for thumbnails, no eager loading of full-size
  previews, client-side filtering.
- If volume grows, a backend follow-up (paginated/filtered works listing or an
  eligible-images endpoint) is required — to be proposed to the user, not
  created by this task.

## Scope

In scope:

1. Service layer (Axios via `lib/api/http.ts`) for `GET /home-image` and
   `PATCH /admin/home-image`, with types matching the contract exactly and a
   dedicated TanStack Query key.
2. A clearly identified admin area to configure the Home image (route and
   navigation placement decided by `architect`).
3. Display the currently active image (or a clear "no image configured / not
   eligible" state when `image` is `null`).
4. Browse eligible images with previews, and visually identify the active one
   (match on `workId` + `imageId`, not URL).
5. Select and persist via `PATCH`; the request body contains **only**
   `{ workId, imageId }`. No free-text URL input anywhere.
6. Success/error feedback (toast and/or inline), then reflect the new
   selection (update/invalidate the home-image query with the `200` response).
7. Loading, empty (no eligible images), and error states for both the current
   image and the candidates list, with retry.
8. Error mapping: `400`, `401` (session flow already handled by the HTTP
   client/auth), `404`, `409` (e.g., work unpublished since the list was
   loaded — suggest refreshing), `429`, `500`. Refetch candidates after
   `404`/`409`.
9. Accessibility (keyboard-selectable options, visible focus, selected state
   exposed to assistive tech, meaningful `alt` with fallback when `alt` is
   empty, prevents double submit while pending) and responsive layout.
10. Unit/component tests for services, error mapping, and the UI states;
    lint, typecheck, build pass; >= 80% coverage on new/changed code.

Out of scope:

- Rendering the hero on the public Home (CARSHOP-161), including Home
  ISR/revalidation after changes.
- Uploading new images or editing `alt` (existing works flow).
- Any new backend endpoint, pagination, or contract change.
- Client-side authorization logic beyond the existing admin session guard —
  the backend is the authority (`401`/`409`/`404`).
- Clearing/unsetting the Home image (no contract for it).

## Conflicts, risks, and dependencies

1. **Backend not merged (blocker for integration/merge ordering).**
   CARSHOP-159 exists only on backend branch `feat/CARSHOP-159` (currently
   checked out locally) and is not on backend `master`. Implementation and
   mocked tests can proceed against the documented contract, but: runtime
   validation requires running the backend from that branch, and this
   frontend task must not be released/merged before CARSHOP-159 is merged
   and deployed. Any contract change before merge must be re-checked here.
2. **"Don't load everything at once" vs. contract.** See "Sourcing eligible
   images": not achievable with the current contract; accepted risk for now,
   potential backend follow-up. **Flagged to the user.**
3. **Admin nav rule.** `admin-nav-links.ts` forbids new sections without an
   architecture decision → `architect` must decide route/placement (new nav
   section vs. dashboard entry point).
4. **Image host.** `next/image` only allows `res.cloudinary.com`. Contract
   URLs are derived from system storage (expected Cloudinary). If the backend
   returns another host, previews will fail — confirm during runtime
   validation; do not widen `remotePatterns` without justification.
5. **Stale eligibility.** The candidates list may become stale (work
   unpublished/deleted by another action). UI must handle `404`/`409`
   gracefully and refetch; the frontend must not re-implement eligibility as
   authorization — it only filters for display.
6. **Active image may be `null` even if configured** (ineligible reference).
   The UI must not assume a stored reference exists when `image` is `null`.

## Size classification

**NON-TRIVIAL** — new admin route/area and possibly navigation change, new
service layer and query/mutation, image browsing UX with a data-sourcing
decision, multiple states and error mappings, and an unmerged backend
dependency.

Next agents:

- `knowledge-reader` — recommended (prior admin patterns: CARSHOP-148/152
  nav decisions, image handling from works/gallery tasks, query-key
  conventions).
- `architect` — **required** (route and nav placement, Server vs Client
  boundaries, candidate source (a)/(b), browsing/grouping UX, query keys and
  invalidation, visual strategy per `docs/design/` Admin sections).
- `plan-writer` — **required** (persist `specs/CARSHOP-160/plan.md`).
