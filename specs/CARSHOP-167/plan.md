# CARSHOP-167 — Implementation plan: Public Home Services section (`#services`)

Task classified as **NON-TRIVIAL** by the `spec-writer`
(`specs/CARSHOP-167/spec.md`). This plan faithfully persists the `architect`
decision and the user-approved decisions, translating them into actionable,
verifiable steps for the `developer`. No new architectural decision is
introduced here.

Branch: `feat/CARSHOP-167-home-services-section`.

No Figma: the authoritative visual source is `docs/design/*` plus the current
Home direction (CARSHOP-144/161/170). CARSHOP-162 (single-page Home
consolidation) is **out of scope — do not pre-implement**; only the
`#services` anchor is in scope.

## User decisions (binding)

1. **Service content**: the three pillars of the published tagline —
   `Upholstery`, `Restoration`, `Custom Work` — are used as editorial titles,
   **without descriptions**. Real work categories from `getWorks()` are shown
   as supporting evidence. This explicitly **supersedes the CARSHOP-144
   omission** of the Services section.
2. **Section CTA**: links to `/contact`. "Get a Quote" stays disabled and is
   **not** part of this section.
3. **Route/navigation**: `/services` route and navigation stay unchanged; the
   single-page Home consolidation belongs to CARSHOP-162.
4. **Empty/failure semantics**: `#services` is **always present**. Only the
   categories evidence is omitted when `getWorks()` fails or returns no works.
5. **Secondary link** "All services → /services": **not included** (default).

## Spec correction

`spec.md` (content inventory, ~line 70) lists the headline
"CRAFTED FOR YOUR CAR. BUILT FOR THE ROAD." among design-direction content
not approved as service copy. Correction recorded by the `architect`:

- The headline "Crafted for your car. Built for the road." **is approved**
  (CARSHOP-144 §4), but it is already the `HomeHero` `h1`
  (`app/(public)/_components/home-hero.tsx`, ~line 75). It is therefore
  **not reused** in this section; the section `h2` is `Services`.
- The `docs/design/visual-direction.md` list "Restoration / Custom Interiors /
  Repairs" is **not used** (not approved as real CarShop services).

## Architect decision (source of truth — do not reinterpret)

### a) Position in the Home

`HomeHero` → `HomeServices` (`#services`) → `FeaturedWorks` ("Our Work") →
`HomeReviews` (`#reviews`) → `FinalCta`.

### b) Server vs Client / imagery

- Pure Server Component; **no** `"use client"`.
- **No images** in the section (avoids competing with the portfolio,
  duplicating hero/featured photos, and any below-the-fold preload concern).

### c) Component

New file `app/(public)/_components/home-services.tsx` exporting
`HomeServices`.

- Props: `{ categories: readonly Pick<ServiceCategory, "key" | "label">[] }`.
- Same-file constants:
  - `SERVICE_PILLARS = ["Upholstery", "Restoration", "Custom Work"] as const`
    with a comment citing the CARSHOP-144 tagline and the CARSHOP-167 user
    approval.
  - `HOME_SERVICE_CATEGORIES_LIMIT = 6`.
- No extra sub-components.

### d) Reuse boundary — move `groupWorksByCategory`

- `git mv` `app/(public)/services/_lib/group-works-by-category.ts` and
  `group-works-by-category.test.ts` → `app/(public)/_lib/` (precedent:
  `format-comment-date`, CARSHOP-170).
- Update the moved file's internal relative imports
  (`../_components/project-preview`, `../portfolio/_lib/resolve-preview-image`
  from the new location).
- Update importers to the alias
  `@/app/(public)/_lib/group-works-by-category`:
  - `app/(public)/services/page.tsx`
  - `app/(public)/services/_components/service-category-row.tsx`
  - `app/(public)/services/_components/service-category-row.test.tsx`
- `ServiceCategoryRow` **stays** in `/services` (not reused on the Home).

### e) Data / composition (`app/(public)/page.tsx`)

- Render `<HomeServices categories={groupWorksByCategory(works)} />` between
  `HomeHero` and the `FeaturedWorks` conditional.
- `getWorks()` is still called **once** (existing `Promise.allSettled`;
  `works = []` on failure). No extra request, no `React.cache` needed.

### f) UI (no Figma; `docs/design/`)

- Wrapper: `PageSection spacing="standard" id="services"
  aria-labelledby="services-heading" className="border-t border-border"`.
- Grid: `grid-cols-1 lg:grid-cols-12`.
  - Left `lg:col-span-4`: `h2#services-heading` "Services"
    (`text-heading-2`) and the CTA.
  - Right `lg:col-span-8`: `<ol>` with `divide-y divide-border border-t`.
    Each `<li>`: `aria-hidden` number `01`/`02`/`03`
    (`text-label text-muted-foreground`) + pillar name in large display
    typography from the typography tokens (developer picks within existing
    tokens). Pillars are **not headings**; no descriptions, icons or arrows.
- Below the list, **only if `categories.length > 0`**:
  - `<p id="services-categories-label" className="text-label text-muted-foreground">Project categories</p>`
  - `<ul aria-labelledby="services-categories-label">`, `flex-wrap`, with
    `aria-hidden` `·` separators; labels `text-body text-secondary-foreground`;
    plain text (no links, no counts, no `lang` attribute); exact API labels,
    in the order received, sliced to `HOME_SERVICE_CATEGORIES_LIMIT` (6).
- DOM order: heading → pillars → evidence → CTA. On `lg`, the CTA is placed
  explicitly in the left column via `lg:col-start-*` / `lg:row-start-*` (as in
  `ServiceCategoryRow`); **no** CSS `order`.
- CTA: text `Link` "Contact CarShop", `href="/contact"`, styled like
  "View all projects" in `FeaturedWorks` (`inline-flex min-h-11`,
  `focus-visible:ring-3 ring-focus-ring`, `LuArrowRight` `aria-hidden`).
- Anchor offset: check `scroll-margin-top` against the sticky header; add
  `scroll-mt-*` on the section if needed. **Do not change the header.**

### g) Out of scope

`HomeCtaActions` (including any rename), navigation, `HomeHero`,
`FeaturedWorks`, `HomeReviews`, `FinalCta`, Home metadata, `/services`
redesign, backend/endpoints, quote flow.

## Files to touch

| File | Change |
| --- | --- |
| `app/(public)/services/_lib/group-works-by-category.ts` → `app/(public)/_lib/group-works-by-category.ts` | `git mv`; fix internal relative imports |
| `app/(public)/services/_lib/group-works-by-category.test.ts` → `app/(public)/_lib/group-works-by-category.test.ts` | `git mv`; path only |
| `app/(public)/services/page.tsx` | Import from `@/app/(public)/_lib/group-works-by-category` |
| `app/(public)/services/_components/service-category-row.tsx` | Same import update |
| `app/(public)/services/_components/service-category-row.test.tsx` | Same import update |
| `app/(public)/_components/home-services.tsx` (new) | `HomeServices`, `SERVICE_PILLARS`, `HOME_SERVICE_CATEGORIES_LIMIT` |
| `app/(public)/_components/home-services.test.tsx` (new) | Section tests |
| `app/(public)/page.tsx` | Compose `HomeServices` between `HomeHero` and `FeaturedWorks` |
| `app/(public)/page.test.tsx` | Order expectations, `#services` always present, degraded cases |

## Implementation order

1. **Move `groupWorksByCategory`** (+ test) with `git mv` to
   `app/(public)/_lib/`; fix internal imports; update the three importers to
   the alias. Run `services/page.test.tsx`, `service-category-row.test.tsx`
   and the moved test — all must stay green with no behavior change.
2. **`HomeServices`** Server Component + `home-services.test.tsx`.
3. **Home composition** in `app/(public)/page.tsx` + update `page.test.tsx`.
4. **Anchor offset**: verify `#services` under the sticky header; add
   `scroll-mt-*` to the section only if needed.
5. **Validation**: `lint`, `typecheck`, `test` (coverage ≥ 80% on
   new/changed code), `build`; then dev server validation.

## Required tests (Vitest + RTL)

- `home-services.test.tsx`:
  - section has `id="services"` and `aria-labelledby="services-heading"`;
    exactly one `h2` "Services";
  - the three pillars render in order inside an `<ol>` and are **not**
    headings;
  - categories render with exact API labels (e.g. `bancos`) in received
    order; limited to 6;
  - with `categories = []`: section and CTA render; no "Project categories"
    label and no evidence list;
  - CTA `href="/contact"`; no "Get a Quote";
  - no `img`;
  - forbidden copy absent: "Custom Interiors", "Repairs", "built to last",
    "free", `/\d+\+/`, pt-BR UI state strings.
- `page.test.tsx`:
  - the 3 existing order tests updated to `home-hero-heading` →
    `services-heading` → `our-work-heading` → (`reviews-heading`) →
    `final-cta-heading`;
  - new cases: `#services` present with empty works and with `getWorks`
    failure (no evidence list in both);
  - `getWorksMock` called once;
  - image count unchanged;
  - `expectDegradedHome` updated to include `#services`.
- Moved `group-works-by-category.test.ts`: path change only.
  `services/page.test.tsx` and `service-category-row.test.tsx` stay green.

## Dev server validation

Use a dedicated port and stop only the process started by the agent (never
kill the user's dev server). Verify:

- Home renders `#services` right after the hero, with the three pillars, real
  category labels (up to 6) and "Contact CarShop" → `/contact`.
- Layout at mobile / `md` / `lg` (CTA in the left column on `lg`, after the
  evidence in DOM/mobile).
- Navigating to `/#services` is not hidden by the sticky header.
- With no works / API failure, the section still renders without the
  categories evidence.
- `/services` unchanged.

## Risks (from architect)

1. pt-BR category labels inside English copy — accepted (same as
   `/services`, CARSHOP-147).
2. Pillars may look visually thin without descriptions — mitigate with
   typography/spacing only; **no added copy**.
3. Home order tests break until updated (step 3).
4. Sticky header may hide the anchor target — handle with `scroll-mt-*` on
   the section only.

## Constraints

- No `any`, `as any`, `@ts-ignore`, `@ts-expect-error` or unsafe casts.
- No invented services, descriptions, counts, claims or endpoints; nothing
  copied from the functional reference.
- No secrets or `.env` values in code, tests, logs or docs.
- Do not commit unless the user explicitly asks.
