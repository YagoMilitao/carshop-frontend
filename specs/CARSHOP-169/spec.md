# CARSHOP-169 — Public Home: About / Craftsmanship section with differentiators

## Reference

Notion task: CARSHOP-169 ("Criar seção Craftsmanship e diferenciais na
Home"). Full Description, DoD (7 items) and Technical Notes live in the task;
only the essentials are summarized here.

Feature · Priority Medium · Sprint 6 · Component: Public UI · Epic: Frontend
Público · 3 points · Stack: Frontend · **No Figma**, no links, no blocking
relations. Authoritative visual source: `docs/design/*` + current Home
direction (CARSHOP-144/161/167/170).

Goal: one editorial Home section that explains who CarShop is and why its
work is different, using **only real, approved information**. The DreamUP
reference informs the *role* of the section (company presentation + benefits
as trust signals), never its claims, copy, imagery or composition.

Key constraints from DoD / Technical Notes (condensed):

- Section `#about`/`#craftsmanship` with short narrative and strong visual.
- Differentiators must be approved facts about CarShop; no DreamUP claims
  (years of experience, reach, discounts, certifications, benefits,
  "family owned", countries served).
- Real workshop / professional / process photography prioritized when
  available.
- No statistics, badges or unsourced claims.
- Separate factual proof from brand language.
- Integrates visually with the other sections; no SaaS card look.
- Responsive, accessible, semantic; relevant tests + lint/typecheck/build.

## Current repository state (master @ 712a7da)

- Home `app/(public)/page.tsx` (async Server Component, `Promise.allSettled`
  over `getWorks()` + `getHomeImage()`, silent degradation). Order today:
  `HomeHero` → `HomeServices` (`#services`, always present) →
  `FeaturedWorks` (when works exist) → `HomeReviews` (`#reviews`, omitted
  when empty) → `FinalCta`.
- `HomeHero` already uses the `visual-direction.md` "Craftsmanship Section"
  headline as the page `h1`: "Crafted for your car. Built for the road.", plus
  the tagline "Upholstery · Restoration · Custom Work".
- `HomeServices` (CARSHOP-167) already presents the three tagline pillars
  (`SERVICE_PILLARS`) as editorial numbered rows + real work categories +
  "Contact CarShop" link. Pattern: `PageSection` + `border-t` + 12-col grid,
  `h2` with `aria-labelledby`, no cards.
- `/about` (`app/(public)/about/page.tsx`): ISR page with `h1` "About CarShop",
  the one-line description "Automotive upholstery, restoration and custom
  interior work.", an explicit code comment that the **approved business
  story is pending**, and an optional real work photo via
  `about/_lib/select-about-image.ts` (first work with an image, from
  `GET /works`).
- Navigation `components/layout/nav-links.ts`: "About" points to the `/about`
  route. **No `#about` or `#craftsmanship` anchor exists anywhere in the
  code.** Anchor navigation consolidation is CARSHOP-162 (not done).
- `/contact` and `FinalCta`: no phone/address/hours; code comment states no
  business info has been confirmed. Social links only via env (not facts
  for this section).
- `public/` contains **no image assets**. All photography comes from the
  backend (`GET /works` images, `GET` home image configured in admin).
  There is no workshop / team / process photography anywhere in the repo or
  any known endpoint; work images are completed-project photos (no field
  identifies "process" or "workshop" shots).
- No institutional/content endpoint exists in the backend; no content or
  constants file holds business facts beyond what is listed below.
- `feat/CARSHOP-171` (Home contact section, not merged) could not be
  inspected from the master working tree; the Home composition and any new
  facts it introduces must be re-checked by `architect`/`developer` against
  that branch before implementation (merge order risk on
  `app/(public)/page.tsx` and its test).

## Content inventory — what is real/approved

| Fact / content | Source | Status |
| --- | --- | --- |
| CarShop does automotive upholstery, restoration and custom interior work | Home/About/Contact metadata; `/about` body; `HomeHero` tagline | Published |
| Tagline pillars "Upholstery · Restoration · Custom Work" | `home-hero.tsx`, `home-services.tsx` (`SERVICE_PILLARS`, user-approved in CARSHOP-167) | Approved |
| Headline "Crafted for your car. Built for the road." | `home-hero.tsx` (already the Home `h1`) | Published (already used) |
| Real completed projects (title, category, images, links) | `GET /works` | Real data (evidence, not claims) |
| Real customer reviews | `#reviews` (CARSHOP-170) | Real data, already on the Home |
| Positioning: US-based automotive upholstery business specializing in interior restoration/customization | `docs/design/visual-direction.md` "Business Context" | Design context — **not confirmed as publishable fact** (location/market not confirmed elsewhere) |
| "20+ YEARS", "PREMIUM MATERIALS", "CUSTOM BUILT"; "Restoration / Custom Interiors / Repairs" | `docs/design/visual-direction.md`, `docs/design/components.md` | **Examples only — not approved** (explicitly forbidden by DoD unless confirmed) |

## Content gaps (recorded, not invented)

Recorded already in CARSHOP-147 follow-ups and confirmed again here:

- No approved business story / About narrative (who CarShop is, founder,
  team, how it started).
- No approved list of differentiators (e.g. process, materials used,
  hand-stitching, warranty, turnaround, in-house work) — none exists.
- No years of operation, location/service area, team size, certifications.
- No workshop, craftsman, team or process photography.
- No phone/address/hours (outside this task's scope anyway).

## Conflicts / open decisions — flag to the user before proceeding

1. **Approved differentiators do not exist (BLOCKER for DoD item 2).** The
   DoD requires "differentiators that are approved facts about CarShop".
   The repo contains only the generic scope (upholstery, restoration, custom
   interior work) already displayed by Hero and Services. Options:
   (a) user provides/approves 2–4 short factual differentiators and a 1–3
   sentence narrative (see "Content needed" below);
   (b) build the section only with evidence already real (scope sentence +
   real project photo/links + pointer to reviews), with **no**
   differentiator list — partially meets DoD, mostly redundant with
   `#services`;
   (c) postpone the task until the business supplies content.
   **User decision required. No agent may write differentiators or
   narrative copy on its own.**
2. **Brand language vs. factual proof.** Technical Notes require separating
   them. Even "brand language" (e.g. a headline) must be approved: the
   design-doc headline is already the Hero `h1` and must not be duplicated.
   User must approve the section heading/brand line (or accept a neutral
   heading such as "About CarShop", which already exists on `/about`).
3. **Photography.** No workshop/process/team images exist; `public/` is
   empty. Only completed-work photos from `GET /works` are available. Options:
   (a) use a real completed-work photo (detail shot preferred), with a rule
   that avoids repeating Hero/FeaturedWorks images (architect decision, no
   invented fields);
   (b) typographic section without imagery (allowed by `imagery.md`
   "Why CarShop": "Typography may carry this section");
   (c) user supplies real workshop/process photos — would require a delivery
   mechanism (static asset in `public/` vs. admin/backend), which is out of
   this task's scope unless decided. DoD "visual forte" vs. no workshop
   photos must be accepted by the user.
4. **Anchor id (`#about` vs `#craftsmanship`).** Nothing references either
   today; nav "About" points to `/about`. Recommendation: **`id="about"`**,
   matching the existing nav label/route and the likely target of the
   single-page consolidation (CARSHOP-162), while "craftsmanship" remains
   the editorial theme of the content. Do **not** change nav links or remove
   `/about` in this task (CARSHOP-162 scope). User confirmation requested.
5. **Relationship with `/about` page.** The Home section and `/about` would
   share the same (missing) narrative. Architect decides whether content is a
   shared constant reused by both, or Home-only in this task (updating
   `/about` is out of scope unless the user decides otherwise).
6. **Overlap with `#services`.** Scope pillars are already shown in
   `HomeServices`; repeating them as "differentiators" would be redundant
   and not satisfy the DoD intent.
7. **Position in Home order and empty-state semantics** (always present
   with static approved copy vs. image omitted on API failure) — architect
   decision, consistent with CARSHOP-167/170 patterns; must be reconciled
   with the CARSHOP-171 composition.

## Content needed from the user/business (precise list)

To fully satisfy the DoD, provide or approve:

1. Section heading / brand line (English, short), distinct from the Hero
   `h1`.
2. Short narrative (1–3 sentences) on who CarShop is — only facts the
   business confirms (e.g. who does the work, how the work is done).
3. 2–4 factual differentiators, each a short title + optional one-line
   explanation, each verifiable (no years, stats, certifications,
   warranties, reach or "family owned" unless actually true and approved).
4. Whether the "US-based" positioning / location may be stated publicly.
5. Real workshop / craftsman / process photos (if any) and how they should be
   delivered; otherwise approval to use completed-work photos or a
   typographic layout.
6. Anchor confirmation (`#about` recommended).

## Scope (once decisions are made)

1. New Server Component section (e.g. `app/(public)/_components/home-about.tsx`)
   integrated into `app/(public)/page.tsx`: `PageSection` with the chosen
   `id`, `aria-labelledby`, single `h2`, approved narrative and
   differentiators only.
2. Editorial presentation per `docs/design/` (typography, thin dividers,
   asymmetric grid consistent with `HomeServices`); no icon cards, badges,
   statistic widgets or uniform card grid.
3. Imagery per Conflict 3 decision; no `preload` below the fold; meaningful
   alt from real data (`WorkImageThumb` fallback pattern), no invented
   project context.
4. Reuse the Home's existing `works` result if a work photo is used (no extra
   request), keeping silent degradation.
5. Tests (Vitest/RTL): heading/anchor/semantics, only approved content
   rendered, absence of stats/badges, image present/absent behavior, Home
   composition order. Coverage >= 80% on new/changed code. `lint`,
   `typecheck`, `build` pass; dev server validation on a separate port.

## Out of scope

- Inventing or paraphrasing business facts, stats, claims or narrative;
  copying DreamUP content, claims, imagery or layout.
- Changing navigation to anchors, removing or redesigning `/about`
  (CARSHOP-162).
- New endpoints, admin/content management for institutional text or
  workshop photos.
- Changes to Hero, Services, FeaturedWorks, Reviews, FinalCta, Contact
  beyond Home composition order.

## Acceptance (from DoD, condensed)

- Home has the `#about` (or decided id) section with short narrative and
  strong visual.
- Only approved CarShop facts; nothing from DreamUP copied or presumed.
- Real workshop/process photography prioritized when available.
- No stats, badges or unsourced claims.
- Visually integrated, no SaaS card look.
- Responsive, accessible, semantic.
- Relevant tests, lint, typecheck, build pass.

## Size classification

**NON-TRIVIAL** — blocked on user-provided/approved content (Conflict 1),
plus architectural/visual decisions (image strategy without workshop
photos, anchor id, relationship with `/about`, Home order and merge
coordination with CARSHOP-171), new Home section, composition change and
tests.

Next agents:

- `knowledge-reader` — recommended (Obsidian/history on About content and
  CARSHOP-144/147/167 content decisions).
- `architect` — required, after the user resolves Conflicts 1–4.
- `plan-writer` — required (`specs/CARSHOP-169/plan.md`).
