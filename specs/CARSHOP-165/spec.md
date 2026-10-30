# CARSHOP-165 — Home work section integrated with Portfolio and project details

## Reference

Notion task: CARSHOP-165 ("Integrar seção de trabalhos da Home com Portfolio e
detalhes existentes"). Full Description, DoD (8 items) and Technical Notes live
in the task; only the essentials are summarized here.

Task · Priority High · Sprint 6 · Component: Public UI, Works · Epic: Frontend
Público · 3 points · **No Figma**. Authoritative visual source: `docs/design/*`
+ current Home direction (CARSHOP-144/161/167/168/169/170/171).
Related: CARSHOP-145 (Portfolio redesign, Done), CARSHOP-146 (Project Details
redesign, Done), CARSHOP-168 (`#process`, Done), CARSHOP-162 (anchor
navigation / single-page consolidation, not done — out of scope).

Goal: the Home shows real work (photography as craftsmanship proof) and the
visitor only leaves the Home when choosing to open a specific project at
`/portfolio/[slug]`; returning from the detail must be predictable.

## Current repository state (branch `feat/CARSHOP-165-home-work-section` @ `8c7a201`)

Most of the DoD is **already implemented** by CARSHOP-144/161:

- `app/(public)/page.tsx` (async Server Component) calls `getWorks()` +
  `getHomeImage()` via `Promise.allSettled` with silent, independent
  degradation. Order: `HomeHero` → `HomeServices` (`#services`) →
  `FeaturedWorks` ("Our Work", only when ≥ 1 featured) → `HomeAbout`
  (`#about`) → `HomeReviews` (`#reviews`, omitted when empty) → `HomeProcess`
  (`#process`, omitted while steps are empty) → `FinalCta` (`#contact`).
- `app/(public)/_lib/select-home-works.ts`: deterministic selection,
  `FEATURED_LIMIT = 3`, works with cover only, never repeats the Hero work.
- `app/(public)/_components/featured-works.tsx`: "Our Work" editorial
  composition (dominant 8 cols + supporting stack), `aria-labelledby=
  "our-work-heading"`, header link "View all projects" → `/portfolio`.
  **The `<section>` has no `id`** (only the heading id). CARSHOP-168's spec
  lists `#our-work` as an anchor, but no such section id exists in code.
- `app/(public)/_components/project-preview.tsx`: shared card, links
  directly to `/portfolio/${slug}`, `WorkImageThumb` (`next/image`) with
  explicit `sizes`, 4:3 editorial frame (matches `docs/design/imagery.md`),
  no `priority` for "Our Work" (lazy).
- Hero caption links to `/portfolio/[slug]` of the Hero work.
- `HomeCtaActions` "View Our Work" → `/portfolio` (used in Hero, `FinalCta`,
  `/contact`, `/services`). Nav (`components/layout/nav-links.ts`) "Our
  Work" → `/portfolio` (nav belongs to CARSHOP-162).
- Detail `app/(public)/portfolio/[slug]/page.tsx`: `BackToPortfolioLink`
  always → `/portfolio` ("Back to portfolio"). No `loading.tsx`/`Suspense`
  allowed in that segment (soft-404 note in the page).
- No `loading.tsx` for the Home; only `app/error.tsx` at root.

### Real API contract (`lib/api/works.ts`)

`GET /works` — public, **no pagination, no `limit`, no `featured` flag**,
backend returns published works only. `GET /works/{slug}` for detail. The
`Work` type has no "featured"/order field beyond the API order. Do not invent
query params or fields; any selection/limit stays client-side (as today).

## DoD status vs. code

| DoD | Status |
| --- | --- |
| 1. Real data, existing integration, no duplicated contracts | Met (`getWorks()` reused; same call feeds Hero/Services/About/Reviews). |
| 2. Cards lead directly to `/portfolio/[slug]` | Met (`ProjectPreview`, Hero caption). |
| 3. No need to go through `/portfolio` to discover work | Met on the Home itself; but every "View Our Work" CTA and the nav point to `/portfolio` instead of the Home section — see Q1. |
| 4. Loading/error/empty inside the Home | Error and empty met (section omitted, other sections intact, tested). Loading: see D3. |
| 5. Item count/loading don't degrade LCP/INP | Met (3 lazy items, ISR `revalidate 3600`, Server Component, no client JS). Re-verify if count changes (Q3). |
| 6. `next/image`, `sizes`, design-system ratios | Met (4:3 editorial, explicit `sizes`). |
| 7. Back from detail returns predictably to the Home work section | **Gap**: no section anchor; detail back link always goes to `/portfolio` — see Q2. |
| 8. SEO and accessibility | Met for the current section; any change must preserve heading outline, `aria-labelledby`, focus rings, link names. |

## Scope (expected, pending Q1–Q3 and architect)

1. Give the Home work section a stable anchor `id` (name per architect, D1)
   so it is addressable (`/#<id>`), consistent with `#services`, `#about`,
   `#reviews`, `#process`, `#contact`. Keep `aria-labelledby` and the
   existing heading id unless the architect decides otherwise.
2. Return path from the detail (DoD 7), per user decision on Q2.
3. CTA targets for "View Our Work"/"View all projects", per user decision on
   Q1 (nav links remain CARSHOP-162).
4. Featured count / single vs. two sections, per user decision on Q3 — the
   default is to keep the single "Our Work" section (Technical Notes: avoid
   redundant galleries).
5. Tests (Vitest + RTL): update `featured-works.test.tsx`,
   `page.test.tsx` (section id; keep existing `aria-labelledby` order arrays
   intact — section order must not change, since `#process` must stay before
   `#contact`), detail page/back-link tests and any CTA tests touched
   (`home-cta-actions`, `home-hero`, `final-cta`, `/contact`, `/services`).
   Coverage ≥ 80% on new/changed code.
6. `lint`, `typecheck`, `build` pass; dev server on its own port (kill only
   its own PID), checking Home → detail → back flow manually.

## Decisions for `architect`

- **D1 — Anchor id** for the section (e.g. `work` vs `our-work`); if a hash
  arrival should move focus like `#contact` (`ContactSectionFocus` pattern),
  or whether that belongs to CARSHOP-162.
- **D2 — Back-link mechanics** (after Q2): e.g. origin-aware link via a
  query param (`?from=home`) vs. keeping a static link; impact on canonical
  URL, ISR/static rendering of `/portfolio/[slug]` (reading `searchParams`
  makes the page dynamic), and the soft-404 constraint (no Suspense above the
  detail).
- **D3 — Loading state.** The works list feeds Hero, Services, About and
  Reviews, so a works-only `Suspense` boundary would not isolate the section
  without refetch/restructuring. Recommendation: treat DoD 4 "loading" as
  satisfied by ISR (cached `GET /works`) + silent degradation, unless the
  architect justifies a `Suspense` split. No `loading.tsx` that would stream
  the whole Home behind a skeleton without justification.
- **D4 — Scroll restoration.** Confirm browser Back from the detail restores
  the Home scroll position (App Router default) and that any explicit link to
  `/#<id>` lands on the section without layout shift (header offset /
  `scroll-margin-top`).

## Open questions for the user (product/scope decisions)

- **Q1 — CTA targets.** Should "View Our Work" in the Hero (and/or
  `FinalCta`) point to the Home section (`/#<id>`) instead of `/portfolio`?
  Should "View all projects" in the section keep pointing to `/portfolio`
  (secondary route, allowed by DoD 3)? `/contact` and `/services` use the
  same `HomeCtaActions`; changing it there is a broader decision. Nav links
  stay in CARSHOP-162.
- **Q2 — "Back" from the detail.** Options: (a) keep "Back to portfolio" →
  `/portfolio` and rely on browser Back for the Home (simplest, but DoD 7
  only partially met by the visible link); (b) origin-aware link: when
  opened from the Home, label/target goes to `/#<id>` (requires D2);
  (c) always link to the Home section (breaks the return path for visitors
  coming from `/portfolio`). Copy for any new label (e.g. "Back to our
  work") must be approved by the user.
- **Q3 — Volume.** Keep 3 featured items in a single "Our Work" section, or
  increase the count / add a second "Work Gallery"? Technical Notes allow two
  sections only if there is enough real content; the number of published
  works with cover is not known from the repository.

## Conflicts / flags

1. **Single-page model vs. current navigation.** The Description assumes the
   visitor stays on the Home, but nav "Our Work" and all "View Our Work"
   CTAs route to `/portfolio`, and CARSHOP-162 (anchor navigation) is not
   done. Not resolved here — see Q1.
2. **Description wording "Featured Work/Work Gallery"** vs. code heading
   "Our Work" (approved copy from CARSHOP-144). Spec assumes "Our Work" stays;
   no copy change without user approval.
3. **CARSHOP-168 spec inaccuracy**: documents `#our-work` as an existing
   anchor; the code only has `id="our-work-heading"` on the `h2`.
4. **Detail is shared by two entry points** (`/portfolio` and Home), so any
   single static back target is wrong for one of them (Q2/D2).

## Out of scope

- Nav link changes, general hash focus (CARSHOP-162).
- New endpoints, query params, a backend "featured" flag or admin ordering.
- Portfolio/detail redesign (CARSHOP-145/146) beyond the back-link behavior.
- Changes to other Home sections or their order.
- Copying DreamUP imagery or composition.

## Size classification

**SMALL** — the section, data integration, cards, images and degradation
already exist; remaining work is an anchor id, CTA/back-link targets and test
updates in a few files. It becomes NON-TRIVIAL only if Q3 adds a second
gallery or Q2/D2 requires restructuring rendering of `/portfolio/[slug]`.
Plan optional.

Next agents:

- `knowledge-reader` — optional (CARSHOP-144/161/168 history captured above).
- `architect` — required, brief: D1–D4 after the user answers Q1–Q3.
- `plan-writer` — not required unless the scope grows (Q3 second gallery or
  dynamic detail rendering).
