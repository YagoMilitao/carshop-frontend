# CARSHOP-167 — Public Home: Services section (`#services`) built from real CarShop scope

## Reference

Notion task: CARSHOP-167 ("Criar seção Services na Home orientada aos
serviços reais da CarShop"). Full Description, DoD (8 items) and Technical
Notes live in the task; only the essentials are summarized here.

Feature · Priority High · Sprint 6 · Component: Public UI · Epic: Frontend
Público · 3 points · Branch `feat/CARSHOP-167-home-services-section` ·
**No Figma** (authoritative visual source: `docs/design/*` + current Home
direction from CARSHOP-144/161/170).

Goal: a `#services` section inside the Home that quickly explains what
CarShop does and leads the visitor to the next step, using **only** real /
already-approved CarShop content. The functional reference
(dreamupautointeriors.com/services) informs the section's *role*, never its
service list, copy, imagery or composition.

Related:

- CARSHOP-144 — Home composition; Services section was **omitted** by user
  decision because no approved service content existed.
- CARSHOP-147 — `/services` page lists real work categories from
  `GET /works` (user-approved "hybrid" content decision, ISR deviation from
  ADR-010); records that no approved service list/descriptions exist.
- CARSHOP-161 — current Home data composition (`Promise.allSettled`, silent
  degradation).
- CARSHOP-170 — `#reviews` section; pattern for anchored, omittable Home
  sections.
- CARSHOP-162 — single-page Home consolidation (anchors/navigation). Not
  implemented yet; do not pre-implement beyond the `#services` anchor.
- CARSHOP-143 — "Get a Quote" CTA disabled until an approved quote flow
  exists.

## Current repository state

- Home `app/(public)/page.tsx` (async Server Component): `getWorks()` +
  `getHomeImage()` via `Promise.allSettled` → `HomeHero` → `FeaturedWorks`
  (when works exist) → `HomeReviews` (`#reviews`, omitted when empty) →
  `FinalCta`. No services section today.
- `HomeHero` already shows the approved tagline
  "Upholstery · Restoration · Custom Work"; Home metadata description:
  "Automotive upholstery, restoration and custom interior work."
- `/services` (`app/(public)/services/page.tsx`): ISR page using
  `groupWorksByCategory(works)` (`services/_lib/group-works-by-category.ts`)
  and `ServiceCategoryRow` (`services/_components/service-category-row.tsx`):
  editorial numbered rows (category label from API, project count, real
  cover photo, up to 4 project links). Comment in code: "no approved source
  of service descriptions exists (content dependency)".
- Navigation (`components/layout/nav-links.ts`) points "Services" to the
  `/services` route (not to an anchor).
- CTAs: `HomeCtaActions` = "View Our Work" (`/portfolio`, real) +
  "Get a Quote" (disabled, `aria-label="Get a Quote (coming soon)"`). Same
  disabled CTA in header/mobile nav. `/contact` exists (static: social
  links + CTAs, no form, no endpoint).
- Backend: no endpoint serves services/institutional content; the only
  public data related to "services" is `Work.category` (free string, pt-BR
  values, e.g. "bancos") from `GET /works`. No services endpoint is to be
  invented.
- No i18n layer; public copy is in English (CARSHOP-143/144/147 decision).

## Content inventory (what is real/approved)

| Source | Content | Status |
| --- | --- | --- |
| `HomeHero` / `docs/design/visual-direction.md` | Tagline "Upholstery · Restoration · Custom Work" | Approved and published (CARSHOP-144) |
| Home/About/Contact metadata | "Automotive upholstery, restoration and custom interior work." | Published |
| `GET /works` → `category` | Real work categories (pt-BR strings) + real cover photos + project links | Real data, already used by `/services` |
| `docs/design/visual-direction.md` "Craftsmanship Section" | "Core services: Restoration, Custom Interiors, Repairs" + headline "CRAFTED FOR YOUR CAR. BUILT FOR THE ROAD." | Design direction; **CARSHOP-144 treated it as non-approved service copy and omitted the section** |
| `docs/design/components.md` | Example service descriptions | Examples, not approved copy |

## Content gaps (recorded, not invented)

- No approved list of services offered by CarShop beyond the tagline.
- No approved per-service descriptions / short copy.
- No approved per-service photography mapping (only work covers per
  category).
- No approved quote/contact flow (form, endpoint, phone, e-mail).

## Conflicts / open decisions — flag to the user before proceeding

1. **Source of the service list.** DoD requires "services matching real
   CarShop scope" with "clear hierarchy and short content", but no approved
   service list/descriptions exist. Options:
   (a) reuse the real work categories from `getWorks()` (same source as
   `/services`, CARSHOP-147) — real, but labels are free pt-BR strings
   (e.g. "bancos") inside English copy, no descriptions;
   (b) use the three pillars of the published tagline (Upholstery /
   Restoration / Custom Work) as headings, **without** per-service
   descriptions (or with descriptions provided/approved by the user) —
   conflicts with CARSHOP-144's decision unless the user now approves them;
   (c) (b) as editorial headings + (a) as real evidence (category/project
   links);
   (d) postpone until the business provides approved copy.
   **User decision required.** `docs/design` "Restoration / Custom
   Interiors / Repairs" must not be used unless the user explicitly approves
   them as real CarShop services.
2. **Section CTA destination.** DoD: "CTA leads to the real contact/quote
   flow defined for the project". No quote flow exists; "Get a Quote" is
   disabled site-wide (CARSHOP-143). Options: reuse `HomeCtaActions`
   (View Our Work + disabled Get a Quote); link to `/contact`; link to
   `/services` ("Explore services"). **User decision required**; enabling a
   quote flow is out of scope.
3. **`#services` on the Home vs. existing `/services` page and nav.** The
   Description assumes a "single-page Home", but CARSHOP-162 is not done:
   nav "Services" points to `/services`, which is a full page. This task
   should add the Home section and **not** remove `/services` or change
   navigation, unless the user decides otherwise. Possible link from the
   section to `/services` to be confirmed.
4. **Always-present anchor vs. data-driven content.** DoD says "there is a
   `#services` section", while CARSHOP-161/170 degrade silently when the API
   fails. If option (a)/(c) is chosen, define whether the section renders
   with static approved content only, or is omitted (no anchor) when there
   are no categories/API failure.
5. **Imagery vs. portfolio.** DoD allows real images "without competing with
   the portfolio". Category covers may repeat photos already shown in
   `HomeHero`/`FeaturedWorks`. `architect` must define whether to use images,
   and if so, a rule that avoids duplicating hero/featured works (without
   inventing fields) and an LCP/`preload` policy (no `preload` below the
   fold).
6. **Position in the Home order** (suggested: after `FeaturedWorks` or right
   after `HomeHero`, before `#reviews`) — `architect` decision.
7. **Reuse boundary.** Reusing `groupWorksByCategory` / `ServiceCategoryRow`
   from `app/(public)/services/` inside the Home crosses route-private
   folders; `architect` decides whether to move helpers to
   `app/(public)/_lib` / `_components` or create a Home-specific variant.

## Scope

1. New Server Component section `#services` integrated into
   `app/(public)/page.tsx` (`PageSection` with `id="services"`,
   `aria-labelledby`, single `h2`), content per the decision in Conflict 1.
2. Editorial/craftsmanship presentation per `docs/design/` (open layout,
   typography/dividers or restrained blocks; **no** uniform SaaS card grid,
   no icons-as-decoration).
3. Optional real imagery per Conflict 5 decision, without competing with
   the portfolio.
4. Section CTA per Conflict 2 decision, using existing real routes only.
5. If data from `getWorks()` is used, reuse the Home's existing `works`
   result (no extra request) and keep silent degradation.
6. Tests (Vitest/RTL): section rendering (heading, anchor, items, CTA,
   no invented content), empty/failure behavior per Conflict 4, Home
   composition order. Coverage ≥ 80% on new/changed code. `lint`,
   `typecheck`, `build` pass; dev server validation.

## Out of scope

- Inventing services, descriptions, prices, guarantees or claims; copying
  DreamUP content, categories, imagery or layout.
- Backend changes or new endpoints; quote form / enabling "Get a Quote".
- Removing/redesigning `/services`; changing navigation to anchors
  (CARSHOP-162).
- Changes to Hero, FeaturedWorks, Reviews, FinalCta beyond composition order.

## Acceptance (from DoD, condensed)

- `#services` integrated into the Home.
- Only real/approved CarShop services; nothing from DoD reference copied or
  presumed.
- Clear hierarchy, short content adequate to the Home.
- No generic SaaS card grid; editorial/automotive craftsmanship direction.
- Real images only, not competing with portfolio.
- CTA to the real contact/quote flow defined for the project.
- Responsive, accessible, semantic SEO preserved.
- Relevant tests, lint, typecheck, build pass.

## Size classification

**NON-TRIVIAL** — requires a user content decision (no approved service
source) and architectural decisions (data source/reuse across route folders,
empty-state semantics, image strategy, Home order), plus a new Home section,
Home composition change and tests.

Next agents:

- `knowledge-reader` — recommended (history of the Services/content
  decisions in CARSHOP-144/147 and any Obsidian notes on Home sections).
- `architect` — required (after the user resolves Conflicts 1–4).
- `plan-writer` — required (`specs/CARSHOP-167/plan.md`).
