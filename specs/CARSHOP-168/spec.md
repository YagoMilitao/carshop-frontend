# CARSHOP-168 — Public Home: "How It Works" process section (structure only)

## Reference

Notion task: CARSHOP-168 ("Criar seção How It Works na Home"). Full
Description, DoD (7 items) and Technical Notes live in the task; only the
essentials are summarized here.

Feature · Priority Medium · Sprint 6 · Component: Public UI · Epic: Frontend
Público · 3 points · **No Figma**. Authoritative visual source:
`docs/design/*` + current Home direction (CARSHOP-144/161/167/169/170/171).
Related: CARSHOP-167 (`#services`, Done), CARSHOP-169 (`#about`, Done),
CARSHOP-162 (anchor navigation, not done — out of scope).

Goal: a short, scannable process section on the Home explaining how a visitor
starts and follows a project with CarShop, bridging Services/Work and the
contact CTA. Steps must reflect the **real** CarShop process, approved before
publication; nothing operational, no timelines, warranties or commitments may
be invented (DoD 2–3, Technical Notes).

## User decision (binding, this session)

**"Só estrutura, sem copy."** Implement the structure only. No real,
approved process content exists, so:

- no step, heading or process copy is publicly rendered while approved
  content is missing;
- the content dependency is recorded (this spec + Notion via `task-manager`,
  with user validation);
- no agent writes, paraphrases or "suggests" step names/descriptions in
  production code.

## Current repository state (branch `feat/CARSHOP-168` @ `cb2c305`)

- Home `app/(public)/page.tsx`: async Server Component; `Promise.allSettled`
  over `getWorks()` + `getHomeImage()`, silent degradation. Order:
  `HomeHero` → `HomeServices` (`#services`, always) → `FeaturedWorks`
  (`#our-work`, when ≥1 featured) → `HomeAbout` (`#about`, always) →
  `HomeReviews` (`#reviews`, omitted when empty) → `FinalCta` (`#contact`,
  always, `CONTACT_SECTION_ID`).
- Established content patterns:
  - `home-services.tsx`: approved copy as typed `as const` constant
    (`SERVICE_PILLARS`) colocated in the component; editorial numbered
    `<ol>` with `divide-y` + `border-t`, `PageSection spacing="standard"`,
    `border-t border-border`, 12-col grid, `h2` + `aria-labelledby`, CTA via
    `ContactAnchorLink` ("Contact CarShop" → `/#contact`).
  - `home-about.tsx`: exported typed content constant
    (`HOME_ABOUT_CONTENT … as const satisfies HomeAboutContent`) plus an
    optional `content` prop so tests can exercise variations without
    duplicating literals.
  - `home-reviews.tsx`: **conditional section** — `return null` when the list
    is empty, so neither the section nor its anchor exists.
- Nav `components/layout/nav-links.ts` uses routes (`/services`,
  `/portfolio`, `/about`, `/contact`); no anchors. Nav changes belong to
  CARSHOP-162.
- `app/(public)/page.test.tsx` asserts the exact `aria-labelledby` order of
  Home sections (three order tests) and forbidden-copy regexes
  (`/built to last/i`, `/\bfree\b/i`, `/reviews?\b/i`, `/\d+\+/`,
  `/years of experience|happy customers/i`, before/after, testimonials).
- No content/constant/endpoint anywhere describes the CarShop process
  (searched `app/`, `components/`, `lib/`, `docs/design/`).
  `docs/design/references.md` only lists "Process" as a possible section
  theme and states "The final wording must reflect the actual CarShop
  business process."

## Content inventory

| Content | Status |
| --- | --- |
| Process steps (count, names, descriptions) | **Missing — dependency** |
| Section heading ("How It Works" is the Notion task title, not approved public copy) | **Missing — dependency** (see Decision D2) |
| Timelines, warranties, deposits, consultation format, visit/drop-off rules | Missing — **must never be invented** |
| Contact CTA labels "Get a Quote" / "Contact CarShop" | Already published (CARSHOP-144/167/171) — reusable |

## Scope

1. New Server Component `app/(public)/_components/home-process.tsx`
   (name final per `architect`) that:
   - exports a typed content type (e.g. `HomeProcessStep = { title: string;
     description?: string }`, `HomeProcessContent = { heading: string;
     steps: readonly HomeProcessStep[] }`) and the production content
     constant with **empty steps** (no step text, no placeholder, no TODO
     string, no lorem ipsum);
   - accepts an optional `content` prop (same pattern as `HomeAbout`) for
     testing;
   - **returns `null` when `steps.length === 0`** (same pattern as
     `HomeReviews`): no section, no heading, no anchor rendered.
   - The constant's type must stay wide enough (`satisfies` / explicit
     annotation) that the populated branch typechecks once content arrives —
     no `any`, no casts.
2. Wire into `app/(public)/page.tsx` at the position decided by `architect`
   (see D1). Static content, no new request, no dependency on API state.
3. Populated rendering (exercised only by tests until content exists):
   `PageSection spacing="standard"` + `border-t border-border`, own `id`,
   `aria-labelledby` → single `h2`, steps as an ordered list (`<ol>`),
   editorial presentation per `docs/design/` (typography, thin dividers,
   asymmetric 12-col grid); no icon cards, badges, timelines with durations,
   stats or uniform card grid; must not replicate the reference site's
   composition; must not look identical to the `#services` numbered rows
   (architect decides the differentiation).
4. Connection to contact: optional CTA inside the section reusing an already
   published label/component (`ContactAnchorLink` → `/#contact`) — architect
   decides (D3). No new CTA copy.
5. Tests (Vitest + RTL):
   - `home-process.test.tsx`: renders nothing with the production constant
     (empty steps) — `container` empty / no `section`; with a **test-only
     fixture** passed via `content`: `section` with the decided `id`,
     `aria-labelledby` matching a single `h2`, no `h1`, `<ol>` with
     `li` count = fixture length, description only when present, CTA (if
     any) pointing to `/#contact`; no stats patterns
     (`/\d+\+|%|years of experience/i`). Fixture text must be clearly
     neutral test data and never imported by production code.
   - `app/(public)/page.test.tsx`: Home does not render the process section
     (no element with its `id`/heading id); existing `aria-labelledby`
     order arrays remain unchanged; forbidden-copy regexes unchanged.
   - Coverage ≥ 80% on new/changed code (both branches covered).
6. `lint`, `typecheck`, `build` pass; dev server validation on its own port
   (kill only its own PID), confirming the Home is visually unchanged.

## Decisions for `architect` (no product decision needed from the user)

- **D1 — Position.** DoD: "connects Services/Work to the contact/quote CTA".
  Candidates: after `HomeReviews`, immediately before `FinalCta` (closest to
  the CTA), or after `FeaturedWorks`/before `HomeAbout`. Must be defined now
  so `page.test.tsx` and future order tests are ready when content arrives.
- **D2 — Heading.** Recommendation: keep `heading` inside the content
  constant as part of the pending approved content (not hard-coded in JSX),
  since it is public copy. If the architect/user prefers a fixed heading,
  "How It Works" must be explicitly approved by the user. Nothing renders
  either way while steps are empty.
- **D3 — Section CTA.** Whether the section ends with `ContactAnchorLink`
  (existing label) or relies on the adjacent `#contact` section.
- **D4 — Anchor id.** `process` vs `how-it-works`. No nav link or hash-focus
  behavior in this task (CARSHOP-162).
- **D5 — Step semantics.** `<ol>` with visual numbering (`aria-hidden`) or
  native numbering; step title as `h3` vs `<p>` (HomeAbout uses `<p>`;
  keep outline consistent).

## Content dependency (to record)

Before publication the user/business must provide or approve, in English:

1. Section heading.
2. Number of steps and, for each, a short title and optional one-line
   description, reflecting the actual process (e.g. how a visitor first
   contacts CarShop, how a quote is given, how the work is scheduled and
   delivered) — only facts CarShop confirms.
3. Explicit confirmation that no timeframes, warranties, prices, deposits
   or commitments are stated unless real and approved.

Once delivered, populating the constant is a TRIVIAL follow-up (content
only + test update), subject to the forbidden-copy regexes; any regex match
must be reported to the user, never loosened silently.

`task-manager` should register this dependency in Notion (comment on
CARSHOP-168 or a follow-up task) **only with user validation**.

## Conflicts / flags for the user

1. **DoD partially met by design.** DoD item 1 ("exists a process section on
   the Home with steps") and item 2 (approved steps) cannot be satisfied
   without content; with the user's decision the section exists in code but
   is not rendered publicly. Items 3–7 are met. The task may go to `Review`
   per the standing exception, but should not be considered `Done` (user
   decision) until content is published.
2. **Observation outside this scope.** The current `#about` heading in
   `app/(public)/_components/home-about.tsx` is "Hello, we are DreamUP".
   CARSHOP-169's spec identifies DreamUP as the **reference business**, not
   CarShop. It was user-approved copy in CARSHOP-169 and is not changed
   here, but the user should confirm it is intentional (brand/identity
   risk).

## Out of scope

- Writing, paraphrasing or suggesting process copy in code.
- Nav/anchor changes, hash focus (CARSHOP-162).
- Changes to other Home sections, `/services`, `/about`, `/contact`.
- New endpoints or admin/CMS for process content.

## Acceptance (this task)

- Typed content constant + section component exist; production constant
  has empty steps; Home renders no process section, heading or anchor.
- Populated branch is semantic (`section` + `aria-labelledby` + single `h2`
  + `<ol>`), responsive, accessible and editorial, verified by tests with a
  test-only fixture.
- No invented step, timeline, warranty or commitment anywhere in shipped
  code.
- Home composition and existing tests unchanged in behavior.
- Content dependency recorded.
- Tests (≥ 80% coverage on new/changed code), `lint`, `typecheck`, `build`
  pass; dev server check.

## Size classification

**SMALL** — one new Server Component + its test, a one-line composition
change in `app/(public)/page.tsx` and a `page.test.tsx` update, following
patterns already established by CARSHOP-167/169/170. The content blocker is
resolved by the explicit user decision (structure only). Plan optional — not
required.

Next agents:

- `knowledge-reader` — optional (CARSHOP-167/169 history already captured
  above).
- `architect` — required, brief: D1–D5 (position, heading handling, CTA,
  anchor id, step semantics/visual differentiation from `#services`).
- `plan-writer` — not required (SMALL); the architect decision can be handed
  directly to `developer`.
