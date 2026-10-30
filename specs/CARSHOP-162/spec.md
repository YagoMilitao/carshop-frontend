# CARSHOP-162 — Consolidate the public site into a single-page Home experience

## Reference

Notion task: CARSHOP-162 ("Consolidar site público em experiência single-page
na Home"). Full Description, DoD (11 items) and Technical Notes live in the
task; only the essentials are summarized here.

Feature · Priority High · Sprint 6 · Component: Public UI · 5 points ·
**No Figma**. Authoritative visual source: `docs/design/*` + the delivered
American Automotive Craftsmanship direction (CARSHOP-144/161/165/167–171).

External reference: dreamupautointeriors.com — **information architecture
only** (section roles and order). No DreamUP text, imagery, brand or
distinctive composition may be copied.

Technical Notes: do not reopen CARSHOP-144/145/147 (Done); keep
`/portfolio/[slug]` as the dedicated detail route; coordinate with
CARSHOP-161 and the Sprint 6 section tasks.

Related tasks:

- Done (section owners): 161 (configurable Hero), 165 (`#our-work`), 167
  (`#services`), 168 (`#process`), 169 (`#about` + differentiators), 170
  (`#reviews`), 171 (`#contact`).
- To Do, adjacent (**not absorbed here**): 164 (discontinue replaced
  institutional routes), 166 (single-page regression), 173 (email link in
  About), 174 (public anchor navigation and scroll).

Goal: `/` is the single, coherent place where the institutional content is
consumed, ordered to serve an automotive interiors visitor, with real work
photography as protagonist.

## Current repository state (branch `feat/CARSHOP-162-home-single-page` @ `5ca7662`)

Most section-level work is **already delivered** by the Sprint 6 tasks.

`app/(public)/page.tsx` (async Server Component; `getWorks()` +
`getHomeImage()` via `Promise.allSettled`, silent independent degradation;
one `GET /works` feeds every section) renders, in this order:

| # | Section (component) | Anchor / landmark | Rendered when |
| - | --- | --- | --- |
| 1 | `HomeHero` | no `id`; `aria-labelledby="home-hero-heading"` | always (typographic fallback) |
| 2 | `HomeServices` | `#services` | always |
| 3 | `FeaturedWorks` ("Our Work") | `#our-work`, `tabIndex=-1` | ≥ 1 featured work |
| 4 | `HomeAbout` (narrative + differentiators list) | `#about` | always |
| 5 | `HomeReviews` | `#reviews` | only real, approved comments exist |
| 6 | `HomeProcess` ("From quote to pickup") | `#process` | approved steps (published) |
| 7 | `FinalCta` | `#contact`, `tabIndex=-1`, `ContactSectionFocus` | always |
| — | `Footer` (layout) | `<footer>` | always |

Other relevant facts:

- Anchor helpers exist: `components/layout/section-anchor-link.tsx`
  (generic `/#<id>` + focus), `components/contact/contact-anchor-link.tsx`,
  `app/(public)/_lib/home-anchors.ts` (`OUR_WORK_SECTION_ID`). Only
  `#our-work` and `#contact` are focusable targets (`tabIndex=-1`).
- "View Our Work" (Hero, `#contact`) → `/#our-work` when the section exists,
  otherwise `/portfolio` (CARSHOP-165). "Get a Quote" (header, Hero) →
  `/#contact`.
- **Navigation still points to separate pages**:
  `components/layout/nav-links.ts` → `/services`, `/portfolio`, `/about`,
  `/contact`; used by `header.tsx`, `mobile-nav.tsx` and `footer.tsx`.
- Institutional routes still exist and are in `app/sitemap.ts`:
  `/about` (thin page: heading, one-line tagline, one photo, links),
  `/services` (category rows with photos via `ServiceCategoryRow`),
  `/contact` (heading + `HomeCtaActions` + social links — essentially the
  same content as `#contact`). `/portfolio` and `/portfolio/[slug]` stay.
- In-Home links to institutional pages: `FinalCta` "Contact CarShop" →
  `/contact`; `#process` step 1 copy says "Reach out through our contact
  page…". "View all projects" in `#our-work` → `/portfolio` (allowed).
- Header is not sticky (`relative h-16`), so no `scroll-margin-top` offset is
  needed today.
- Only one work section exists on the Home ("Our Work", 3 items,
  `FEATURED_LIMIT = 3`); there is no separate "Work/Gallery" section.

### Real API contract

`GET /works` (public, no pagination/`featured`/`limit`), `GET /works/{slug}`,
home image endpoint via `lib/api/home-image.server.ts`, reviews via existing
`getHomeReviews`. No new endpoints or query params; any selection/limit
remains client-side as today.

## DoD status vs. code

| DoD (summary) | Status |
| --- | --- |
| 1. `/` concentrates the main public sections coherently | Largely met (7 sections). Coherence of order — see D1. |
| 2. Order considers DreamUP reference (architect may adjust with justification) | **Gap**: current order differs (see "Order comparison"). |
| 3. Reuse real data/components; no duplicated API logic or invented content | Met today; must be preserved by any change. See C1 (DreamUP text present). |
| 4. Stable ids/landmarks for anchor navigation | Partially met: Hero has no `id`; only 2 sections focusable. Boundary with 174 — see Scope. |
| 5. Follows design system / direction | Met per section; re-verify rhythm (borders/spacing) after reordering. |
| 6. Real work photography as protagonist | Met in Hero/"Our Work"/About photo; depends on D2. |
| 7. Home portfolio summary uses real data, links to detail | Met (CARSHOP-165). |
| 8. Reviews only with real approved data | Met (CARSHOP-170; section omitted when empty). |
| 9. Old institutional fragmentation is not the main flow | **Not met**: nav/footer route to `/services`, `/about`, `/contact`. Fix belongs to 174 (nav) and 164 (routes) — see Scope/C2. |
| 10. No DreamUP text/image/brand/composition copied | **Not met**: `#about` heading "Hello, we are DreamUP" — see C1. |
| 11. Responsive, a11y, SEO, perf, lint/typecheck/build, tests | To be validated after changes. |

### Order comparison

DoD reference: Hero → Featured Work → Services → How It Works →
About/Craftsmanship → Why Choose Us → Reviews → Work/Gallery → Quote/Contact →
Footer.

Current: Hero → Services → Our Work → About (+ differentiators) → Reviews →
Process → Contact → Footer.

Differences: (a) Our Work after Services (reference: before); (b) Process
after Reviews (reference: right after Services); (c) "Why Choose Us" is merged
into `#about` as the differentiators list (CARSHOP-169), not a separate
section; (d) no separate Work/Gallery section.

## Scope (this task)

Limited to the **composition of `/`**:

1. Final section order of `app/(public)/page.tsx`, per architect decision D1
   (with written justification based on real available content). Section
   components are reused unchanged unless D1/D2 strictly requires otherwise.
2. Decide and, if approved (Q2), implement the Work/Gallery treatment (D2) —
   reusing `getWorks()` data and existing card/image components, never
   repeating the same works across Hero/"Our Work"/About/gallery without
   justification.
3. Stable identification of every Home section: ensure each rendered section
   is a landmark with `aria-labelledby` and a stable `id` (including a
   decision on the Hero, D3), centralizing ids (e.g. extending
   `home-anchors.ts`) so 174 can consume them. **Making them navigation
   targets (nav links, focus on arrival, scroll behavior) is 174.**
4. In-Home links that send the visitor to institutional pages (e.g. `FinalCta`
   "Contact CarShop" → `/contact`): adjust only per user decision Q3.
5. Home metadata/SEO review (description/OG remain accurate for a
   single-page Home; no invented business claims).
6. Resolve C1 per user decision Q1 (copy change only with approved text).
7. Tests (Vitest + RTL): update `app/(public)/page.test.tsx` section-order /
   `aria-labelledby` arrays and any affected component tests; coverage ≥ 80%
   on new/changed code. `lint`, `typecheck`, `build` pass. Manual check on a
   dev server on its own port (kill only its own PID) at mobile/tablet/
   desktop widths.

## Boundaries with adjacent tasks

- **CARSHOP-174 (anchor navigation and scroll)** owns: `nav-links.ts`,
  header/mobile-nav/footer link targets, hash-arrival focus for all sections,
  active-section state, smooth scroll / `scroll-margin-top`, sticky header.
  162 only guarantees that the section ids/landmarks exist and are stable.
- **CARSHOP-164 (discontinue replaced institutional routes)** owns: removing/
  redirecting `/about`, `/services`, `/contact`, their tests, sitemap entries
  and canonical/redirect strategy. 162 does not delete or redirect any route
  and does not edit `app/sitemap.ts`.
- **CARSHOP-166 (single-page regression)** owns the end-to-end regression
  pass; 162 keeps its own unit/integration tests green.
- **CARSHOP-173 (email link in About)**: not added here.
- **Done tasks (144/145/147/161/165/167–171)**: not reopened; their section
  internals are reused as-is.

Consequence: DoD item 9 cannot be fully satisfied by 162 alone — it is met
only after 174 (and 164). See C2.

## Decisions for `architect`

- **D1 — Section order.** Compare the reference order with real content:
  e.g. move "Our Work" right after the Hero (photography first) and
  `#process` after `#services`; keep differentiators inside `#about` or split
  a "Why Choose Us" section (only titles exist — no approved descriptions,
  so a split may produce a thin section). Justify each deviation. Check
  section border/spacing rhythm and the image non-repetition logic
  (`selectHomeWorks`, `selectHomeAboutImage`) still hold.
- **D2 — Work/Gallery.** Keep a single "Our Work" section (current; avoids
  redundant galleries) vs. add a second gallery further down. Only viable if
  there are enough published works with cover beyond Hero/featured/About;
  the count is not knowable from the repository. Impact on LCP/INP (lazy
  images, `sizes`).
- **D3 — Hero id and id naming.** Whether the Hero gets an id (e.g. for a
  "back to top" target) and a central registry of Home section ids for 174.
- **D4 — Server/Client boundaries.** Reordering must keep `page.tsx` a Server
  Component with existing Client islands only (Hero media, anchor links,
  `ContactSectionFocus`); no new client-side data fetching.

## Open questions for the user

- **Q1 — DreamUP text in `#about` (C1).** `HOME_ABOUT_CONTENT` heading is
  "Hello, we are DreamUP" and the narrative "…your auto interior restoration
  dream is our reality." This was recorded as user-approved copy in
  CARSHOP-169 (already flagged in the CARSHOP-168 spec), but DoD item 10 of
  this task forbids DreamUP text/brand. Should 162 replace it? If yes, the
  user must provide the approved CarShop copy (agents will not write it).
  Is "DreamUP" possibly the real business name (in which case DoD 10 and the
  "reference only" premise need clarification)?
- **Q2 — Work/Gallery.** Keep only "Our Work" (3 items) or add a second
  gallery section (D2)? If added, what limit?
- **Q3 — In-Home links to institutional pages.** Should `FinalCta`
  "Contact CarShop" (→ `/contact`) be removed/retargeted in 162, or left for
  164 when `/contact` is discontinued? Same for the `#process` step 1 copy
  "through our contact page" (copy change only with approved text).
- **Q4 — "Why Choose Us".** Keep merged in `#about` (CARSHOP-169 decision) or
  separate section? Separate only makes sense with approved descriptions.

## Conflicts / flags

1. **C1 — DreamUP brand/text in production code** (`app/(public)/_components/
   home-about.tsx`, asserted in `home-about.test.tsx` and `page.test.tsx`)
   conflicts with DoD 10 and with this task's "reference only" premise. Not
   resolved here — Q1.
2. **C2 — DoD 9 depends on other tasks.** The fragmentation is kept alive by
   nav/footer links (174) and the routes themselves (164). 162 can deliver
   the consolidated Home but cannot meet DoD 9 without scope creep. Proposed:
   mark DoD 9 as satisfied jointly with 174/164; user to confirm.
3. **C3 — Reference order vs. real content.** "Why Choose Us" and
   "Work/Gallery" have no dedicated real content today (differentiator titles
   only; 3 featured works). Following the reference literally would create
   thin or repetitive sections. Architect must justify (D1/D2).
4. **C4 — Copy that assumes institutional pages.** `#process` step 1
   ("our contact page") and `FinalCta` → `/contact` will break or become
   inconsistent when 164 discontinues `/contact`. Needs coordination (Q3).
5. **C5 — Earlier specs name CARSHOP-162 as owner of anchor navigation/nav
   links** (CARSHOP-165/168 specs: "nav links remain CARSHOP-162", "hash
   focus → CARSHOP-162"). The current Notion split assigns that to 174. This
   spec follows Notion (174); flagging the drift so no one assumes 162 covers
   nav.
6. **C6 — `/services` richer content.** `/services` shows per-category rows
   with photos; the Home `#services` shows pillars + category labels only.
   If 164 removes `/services` without Home absorbing anything, that photo
   evidence is lost. Not in 162 unless the user/architect decide the Home
   section should absorb it (would escalate size).

## Out of scope

- Nav/footer link targets, hash focus/scroll behavior, sticky header (174).
- Removing/redirecting `/about`, `/services`, `/contact`; sitemap changes
  (164).
- Redesigning internals of Done sections; Portfolio and project detail
  (`/portfolio`, `/portfolio/[slug]`).
- New endpoints, query params, CMS/admin content.
- Writing or paraphrasing business copy; copying anything from DreamUP.

## Size classification

**SMALL** (baseline) — every section, data path, anchor helper and image
strategy already exists; the remaining work is composition in
`app/(public)/page.tsx`, section id consolidation, possibly small link/copy
adjustments, and test updates. Plan optional.

Escalates to **NON-TRIVIAL** (plan mandatory) if any of these is approved:
a new Work/Gallery section (Q2/D2), a separate "Why Choose Us" section
(Q4), or absorbing `/services`/`/about` content into the Home (C6).

Next agents:

- `knowledge-reader` — optional (history of 144/161/165/167–171 captured
  above; useful only for the DreamUP copy decision in CARSHOP-169).
- `architect` — **required** (DoD 2 explicitly requires a justified order):
  D1–D4, after the user answers Q1–Q4.
- `plan-writer` — only if the scope escalates as described.
