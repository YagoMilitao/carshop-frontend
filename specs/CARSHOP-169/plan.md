# CARSHOP-169 — Implementation plan: Public Home About / Craftsmanship section (`#about`)

Task classified as **NON-TRIVIAL** by the `spec-writer`
(`specs/CARSHOP-169/spec.md`). This plan persists the `architect` decision
and the user decisions taken in this session as actionable, verifiable steps
for the `developer`. No new architectural decision is introduced here.

Branch: `feat/CARSHOP-169` (from `master` @ `721ae6e`, which already includes
CARSHOP-167 and CARSHOP-171).

No Figma: the authoritative visual source is `docs/design/*` plus the current
Home direction (CARSHOP-144/161/167/170/171). CARSHOP-162 (anchor navigation
and hash focus) is **out of scope — do not pre-implement**.

Commits only on explicit user request. Never commit or push on `master`.

## Step 0 — PRECONDITION / BLOCKER (confirm with the user before coding)

**Implementation is blocked until the user delivers the copy.** The user
decided to write it personally:

- section heading (English, short);
- narrative of 1–3 sentences (English);
- 2–4 differentiators (English), each a title plus an optional one-line
  description.

Rules for the copy:

- Used **verbatim**. No agent writes, paraphrases, completes or "improves"
  it. No placeholders, lorem ipsum or TODO text may be merged.
- Heading must not repeat the Hero `h1` ("Crafted for your car. Built for
  the road.") nor be "Services", "Our Work", "Reviews" or "About CarShop".
  If the provided heading collides, report to the user — do not change it.
- "US-based" / "American" positioning is **allowed** (user-approved).
- Before implementing, check the copy against the forbidden-copy regexes in
  `app/(public)/page.test.tsx` (`/reviews?\b/i`, `/\bfree\b/i`, `/\d+\+/`,
  `/built to last/i`, `/years of experience|happy customers/i`) and against
  the stats assertion planned for `home-about.test.tsx`
  (`/\d+\+|%|years of experience/i`). If any match: **warn the user and
  wait**. Never loosen or remove a regex without explicit user approval.

## User decisions (binding, this session)

1. Copy written by the user (see Step 0).
2. Image: one real completed-work photo from the existing works data,
   excluding works already used by Hero and Our Work; typography-only
   fallback when none is available.
3. Anchor: `id="about"`.
4. "US-based" / "American" may appear in the copy.

## Architect decision (source of truth — do not reinterpret)

### 1. Position in the Home

`HomeHero` → `HomeServices` → `FeaturedWorks` (Our Work) → **`HomeAbout`** →
`HomeReviews` → `FinalCta` (`#contact`). If Our Work is omitted, About
follows Services. `#about` is **always rendered** (static copy); only the
image depends on the works API.

### 2. Rendering

- Server Component. No `"use client"`, no `tabIndex`, no
  `ContactSectionFocus`-style hash focus. Hash focus for `#about` stays in
  CARSHOP-162.

### 3. Files

- New: `app/(public)/_components/home-about.tsx` — exports `HomeAbout` and
  the copy constant `HOME_ABOUT_CONTENT`.
- New: `app/(public)/_lib/select-home-about-image.ts` — pure helper.
- New colocated tests: `app/(public)/_components/home-about.test.tsx`,
  `app/(public)/_lib/select-home-about-image.test.ts`.
- Changed: `app/(public)/page.tsx`, `app/(public)/page.test.tsx`.
- **Do not touch**: `app/(public)/about/**` (including
  `select-about-image.ts`), `app/(public)/portfolio/_lib/resolve-preview-image.ts`,
  nav links, other Home sections.

### 4. Copy constant (in `home-about.tsx`)

```ts
type HomeAboutDifferentiator = { title: string; description?: string }
type HomeAboutContent = {
  heading: string
  narrative: string
  differentiators: readonly HomeAboutDifferentiator[]
}
export const HOME_ABOUT_CONTENT = { /* user copy, verbatim */ } as const satisfies HomeAboutContent
```

Copy lives only on the Home; `/about` remains unchanged.

### 5. Image selection helper

`selectHomeAboutImage(works: readonly Work[], selection: HomeWorksSelection): HomeWork | null`

- Build a `Set` of excluded ids from `selection.hero?.work?.id` and
  `selection.featured[].work.id`.
- Iterate `works` in API order, skip excluded ids, return the first
  `{ work, image }` where `resolvePreviewImage(work)` (imported from
  `../portfolio/_lib/resolve-preview-image`, same as `select-about-image.ts`)
  is non-null; otherwise `null`.
- Exclusion is per work (not per image).
- Reuse the existing `Work`, `HomeWork`, `HomeWorksSelection` types; no new
  request (reuse the Home's existing `works` result).
- In `page.tsx`:
  `const aboutImage = selectHomeAboutImage(works, { hero, featured })` and
  render `<HomeAbout image={aboutImage} />` between `FeaturedWorks` and
  `HomeReviews`. On `getWorks()` failure, `works` is empty → `null` image →
  section still rendered (silent degradation).

### 6. Semantics

- Root: `<PageSection spacing="standard" id="about" aria-labelledby="home-about-heading" className="border-t border-border">`.
- Exactly one `<h2 id="home-about-heading" className="text-heading-2 text-foreground">`.
- Narrative: `<p className="text-body-lg text-secondary-foreground">`.
- Differentiators: `<ul>` with `divide-y divide-border border-t border-border`;
  each `<li className="py-6 lg:py-8">` with title
  `<p className="text-heading-3 text-foreground">` and optional description
  `<p className="text-body text-secondary-foreground">` (rendered only when
  present). **No `h3`.**
- Image: `<figure>` containing `WorkImageThumb` + `<figcaption>` with the
  category (`text-label text-muted-foreground`) and a `Link` to
  `/portfolio/{slug}` with the work title and `LuArrowRight` (`aria-hidden`).
  Link classes match existing Home text links (`min-h-11`,
  `focus-visible:ring-3 focus-visible:ring-focus-ring`). The image is **not**
  inside the link.
- No CTA of its own. No badges, stats, icon cards or uniform card grid.

### 7. Layout

- Grid: `grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-x-8 lg:gap-y-6`.
- With image (DOM order: [h2 + narrative] → figure → list), add
  `lg:grid-rows-[auto_1fr]`:
  - text block: `lg:col-span-5 lg:col-start-1 lg:row-start-1`;
  - list: `lg:col-span-5 lg:col-start-1 lg:row-start-2`;
  - figure: `lg:col-span-6 lg:col-start-7 lg:row-span-2 lg:row-start-1`.
- Without image: text `lg:col-span-5`; list `lg:col-span-6 lg:col-start-7`.
- Switch classes via `cn` based on `image !== null`.

### 8. Image rendering

`WorkImageThumb` with `fallbackAlt={work.title}`, **no** `priority` /
preload (lazy), `className="aspect-4/3 lg:aspect-4/5"`,
`sizes="(min-width: 1280px) 544px, (min-width: 1024px) 50vw, 100vw"`.

## Implementation order

1. **Step 0** — receive and validate the user copy (blocker; regex check).
2. `select-home-about-image.ts` + its tests (TDD-friendly, pure).
3. `home-about.tsx` (constant with verbatim copy + component) + its tests.
4. Wire into `app/(public)/page.tsx` (position per §1).
5. Update `app/(public)/page.test.tsx`.
6. Run `lint`, `typecheck`, tests with coverage, `build`.
7. Dev server validation on its **own port**; kill only its own PID — never
   the user's dev server, never `pkill "next dev"`. Check `/` at mobile and
   desktop widths, with and without an available About image.
8. Rebase on latest `master` before opening a PR (only when the user asks).

## Tests

### `select-home-about-image.test.ts`

- Excludes Hero work and Featured works.
- `hero.work` is `null`.
- `hero` `null` and `featured` empty → first work with an image.
- Uses a non-cover image via `resolvePreviewImage`.
- Respects API order.
- Returns `null` for empty list, all excluded, and works without images.

### `home-about.test.tsx`

- `section#about` with `aria-labelledby="home-about-heading"`.
- Single `h2`; no `h1`, no `h3`.
- Narrative rendered; `li` count equals `HOME_ABOUT_CONTENT.differentiators.length`
  and is between 2 and 4; description only when present.
- Assertions read from `HOME_ABOUT_CONTENT` (no duplicated literals).
- With image: `figure`, alt (including fallback to title), `loading="lazy"`,
  `sizes`, category in caption, link to `/portfolio/{slug}`.
- Without image: no `img`, `figure` or portfolio link; section still present.
- No stats patterns: `/\d+\+|%|years of experience/i`.

### `app/(public)/page.test.tsx` updates

- Add `'home-about-heading'` to the `aria-labelledby` order arrays, after
  `our-work-heading` (or after `services-heading` when Our Work is omitted),
  in the three order tests.
- `expectDegradedHome`: expects `#about` present without `img`.
- With 5 works: image count 4 → 5 (About = work-5, lazy); still exactly 1
  priority image.
- "skips works without cover": About now shows work-1 (non-cover image) →
  adjust image count to 3 and scope the "Work 1" check to Hero + Our Work.
- New cases: About = work-5 when the Admin home image uses `workId '3'`;
  `#about` present without image when `getWorks` fails; `getWorksMock`
  called exactly once.
- Forbidden-copy regexes stay as they are (see Step 0).

Coverage ≥ 80% on new/changed code.

## Definition of Done mapping

| DoD item | Covered by |
| --- | --- |
| `#about` section with short narrative and strong visual | §1, §6–§8; work photo or typography-only fallback (user-approved) |
| Only approved facts, nothing from DreamUP | Step 0 (user copy verbatim) |
| Real workshop/process photography when available | None exists; user approved completed-work photo (§5) |
| No stats, badges, unsourced claims | §6; stats regex tests; forbidden-copy regexes |
| Visually integrated, no SaaS cards | §6–§7 (editorial dividers, 12-col grid like `HomeServices`) |
| Responsive, accessible, semantic | §6–§7; tests for semantics; dev server check |
| Tests, lint, typecheck, build | Tests section; implementation step 6 |

## Risks

- **Content blocker**: nothing can be merged until the user copy arrives.
- Copy matching forbidden-copy regexes → warn the user; never loosen tests
  without approval.
- Small portfolio (≤ 4 works with an image) → About renders typography-only.
  This is expected behavior, not a bug.
- Merge conflicts in `page.tsx` / `page.test.tsx` with other Home tasks →
  rebase on `master` before the PR.
- CARSHOP-162 depends on `#about` always being present — do not make the
  section conditional.

## Follow-ups (not in this task)

- Share the About copy with the `/about` page (requires user decision).
- Extract a shared figure/figcaption component if a third use appears.
- Hash focus / anchor navigation for `#about` — CARSHOP-162.
