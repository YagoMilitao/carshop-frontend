# CARSHOP-171 — Public Home: Contact / Request a Quote section (`#contact`)

## Reference

Notion task: CARSHOP-171 ("Criar seção Contact e Request a Quote na Home").
Full Description, DoD (8 items) and Technical Notes live in the task; only
the essentials are summarized here.

Feature · Priority High · Sprint 6 · Component: Public UI · Epic: Frontend
Público · 5 points · Branch `feat/CARSHOP-171` · **No Figma** (authoritative
visual source: `docs/design/*` + current Home direction from
CARSHOP-144/161/167/170). No Blocked by / Blocking.

Goal: a conversion-oriented closing section on the Home that tells the
visitor how to contact CarShop or request a quote without leaving the page,
using **only** real/approved CarShop channels and data. The DreamUP
reference informs the UX *principle* (Get a Quote / contact as funnel
closure), never its data, form, copy or layout.

Technical Notes (mandatory step): before implementation, `architect` must
inventory the current contact flow and confirm whether a real endpoint
exists. That inventory is pre-filled below and must be confirmed by the
`architect`.

Related:

- CARSHOP-143 / CARSHOP-144 §3 / CARSHOP-147 §5 — "Get a Quote" disabled
  site-wide until an approved quote flow exists. **Superseded** (see
  "Superseded decisions").
- CARSHOP-144 — no "Free" quote, no response-time promises (still valid).
- CARSHOP-161 — Home composition and silent degradation.
- CARSHOP-147 — `/contact` page (static: heading, disabled quote CTA, social
  links; no form, no endpoint, no `BusinessInfo`).
- CARSHOP-133 / CARSHOP-22 — social links only from env; never placeholders.
- CARSHOP-167 §2 — `#services` "Contact CarShop" CTA → `/contact`.
  **Superseded** (now `/#contact`).
- CARSHOP-149 FU-5 — contrast of the disabled "Get a Quote" button.
  **Obsolete** once the CTA is enabled.
- CARSHOP-170 — `#reviews`, pattern for anchored Home sections.
- CARSHOP-162 — general anchor navigation / single-page Home consolidation.
  Not pre-implemented here: this task only creates `#contact`.

## Inventory of the current contact flow (repository state)

- Home `app/(public)/page.tsx` order: `HomeHero` → `HomeServices`
  (`#services`) → `FeaturedWorks` → `HomeReviews` (`#reviews`, omittable) →
  `FinalCta`. `FinalCta` (`_components/final-cta.tsx`) has the heading
  "Ready to transform your interior?" + `HomeCtaActions`, **no anchor id**.
- `HomeCtaActions` (`_components/home-cta-actions.tsx`, shared by Hero,
  FinalCta and `/contact`): "View Our Work" → `/portfolio` (real) + "Get a
  Quote" **disabled** (`aria-label="Get a Quote (coming soon)"`).
- Header (`components/layout/header.tsx`) and mobile nav
  (`components/layout/mobile-nav.tsx`) each render their own disabled
  "Get a Quote" button (covered by tests).
- Public header is **not sticky/fixed** (verified: no `sticky`/`fixed`/
  `scroll-mt-*`/`scroll-padding` in public layout/header code; only admin
  sidebar and admin save bar are sticky). An anchor offset
  (`scroll-mt-*`) is therefore not needed today; `architect` re-checks if
  the header changes.
- Navigation (`components/layout/nav-links.ts`): "Contact" → `/contact`
  route (not an anchor).
- `/contact` (`app/(public)/contact/page.tsx`): static Server Component;
  copy "Quote requests are coming soon. In the meantime, see our completed
  work."; `HomeCtaActions`; `ContactFollowLinks`
  (`contact/_components/contact-follow-links.tsx`, social links). A future
  form must be an isolated Client Component; a `BusinessInfo` block only
  when business-confirmed data exists (`docs/rules/rendering.md`).
- No `id="contact"` / `id="quote"` anchor exists anywhere.
- No contact/quote form exists in the frontend. The only public form is the
  comment form (`app/(public)/portfolio/[slug]/comment-form.tsx`), which
  must not be repurposed for quotes.

## Where real/approved CarShop contact data lives

| Data | Source | Status |
| --- | --- | --- |
| Instagram / Facebook / LinkedIn URLs | Server-only env `SOCIAL_INSTAGRAM_URL`, `SOCIAL_FACEBOOK_URL`, `SOCIAL_LINKEDIN_URL` → `serverEnv.social` → `getSocialLinks()` (`lib/social-links.ts`, `server-only`) | Real when configured; each link omitted when unset. Empty by default in `.env.example` |
| Phone / e-mail / address / service area / hours / WhatsApp | — | **Missing** — not to be invented or placeholdered (user decision 1) |
| `/contact` route | `app/(public)/contact/page.tsx` | Real page |

## Backend contract check (documented contracts)

Checked read-only: backend `docs/api-contract.md` and
`src/infra/config/routes.ts`. Public routes: `/auth/*`, `/works`
(+ `/:slug`, `/:workId/comments`), `/home-image`, `/health`; plus admin
routes. **No contact, quote, lead or message endpoint, and no e-mail
delivery infrastructure.** No endpoint is invented; no quote form is built.

## Approved user decisions

1. **Channels.** The section uses only: real social links via
   `getSocialLinks()`, a link to `/contact`, and "View Our Work"
   (`/portfolio`). No invented contact data (phone, e-mail, address, hours,
   WhatsApp, service area). DoD item 6 (form) is **N/A**. **Business
   decision (no quote backend):** customers reach out through the contact
   channels and the communication team talks to them directly; no quote
   form or endpoint is planned, so no backend dependency is recorded.
2. **"Get a Quote" enabled everywhere as a link to `/#contact`.** Applies to
   `HomeCtaActions` (Hero, FinalCta/`#contact`, `/contact`), header and
   mobile menu. Becomes a real link (`next/link`), not a disabled button;
   remove the "(coming soon)" `aria-label`/`aria-disabled`. Header and
   mobile menu need only the static `/#contact` href — `getSocialLinks()`
   is `server-only` and must not be imported there.
3. **Evolve `FinalCta` into the `#contact` section** (add anchor + real
   channels) — no duplicate closing section. Reuse what `/contact` already
   renders (`HomeCtaActions`, `ContactFollowLinks`) instead of duplicating;
   `architect` decides the shared-component boundary (e.g. moving
   `ContactFollowLinks` out of route-private `contact/_components`).
4. **Anchor: only `#contact`** (no `#quote`). `HomeServices` "Contact
   CarShop" CTA → `/#contact`. Nav "Contact" stays on `/contact`. This task
   creates only `#contact`; general anchor navigation stays in CARSHOP-162.

## Superseded decisions (explicit)

Per the user decisions above, the following prior user-validated decisions
are superseded and must not be treated as conflicts during review:

- CARSHOP-143, CARSHOP-144 §3, CARSHOP-147 §5 — gated enabling "Get a
  Quote" on an approved quote flow. Now enabled as a link to `/#contact`
  without a quote flow.
- CARSHOP-167 §2 — Services "Contact CarShop" → `/contact`. Now
  `/#contact`.
- CARSHOP-149 FU-5 (disabled "Get a Quote" contrast) — obsolete; close/mark
  as such (via `task-manager`, with user validation).

Still valid: CARSHOP-144 — no "Free" quote wording, no response-time
promises; CARSHOP-133/22 — no placeholder social links.

## Section presence rule

`#contact` **always renders** (static CTA section, never depends on the
works API — pattern "home-section-presence-static-vs-data-driven", unlike
`#reviews`). If no social link is configured, only the channels block is
omitted; no placeholder, no "coming soon" channel. The section stays a
static Server Component; social links are resolved server-side.

## Open question for the user (do not decide)

- **"Get a Quote" label.** Keep the label "Get a Quote" even though the
  destination (`#contact`) has no quote form, only contact channels? (Any
  alternative label is new copy requiring approval.) Never "Free", never
  response-time promises.
- **Supporting copy.** The existing `/contact` sentence "Quote requests are
  coming soon…" will sit next to an enabled "Get a Quote" link. No agent
  rewrites it on its own; any new/changed sentence (Home section or
  `/contact`) is flagged to the user for approval before shipping.

## Risks / dependencies

No pending risks or dependencies. Resolved by the user:

- **Quote backend** — not a dependency. Business decision: contact happens
  through the existing channels and the communication team handles it
  directly; no quote form/endpoint is planned and nothing is registered in
  Notion.
- **Social channels exposure** — the production `SOCIAL_*_URL` values have
  been updated by the user (previous LinkedIn link-aggregator risk
  resolved). Values are not reproduced here.

## Remaining points for `architect`

- Self-reference inside `#contact`: keep, hide or adjust the "Get a Quote"
  link that points to the section itself.
- Focus behavior on `/#contact` navigation (`docs/rules/accessibility.md`);
  no `scroll-mt-*` needed while the header is non-sticky.
- Shared-component location for `ContactFollowLinks` and how the `#contact`
  section receives `getSocialLinks()` output on the Home.

## Scope

1. Evolve `FinalCta` into the `#contact` section (`PageSection`,
   `id="contact"`, `aria-labelledby`, single `h2`), static Server Component,
   always rendered at the end of the Home.
2. Real channels only: `getSocialLinks()` block (omitted when empty),
   `/contact` link, "View Our Work", "Get a Quote" → `/#contact`.
3. Reuse/extract `/contact` pieces (no duplication); `/contact` keeps
   working with the same content plus the enabled "Get a Quote" link.
4. Enable "Get a Quote" as a link to `/#contact` in `HomeCtaActions`,
   `components/layout/header.tsx` and `components/layout/mobile-nav.tsx`
   (mobile menu closes on navigation as for other links).
5. `HomeServices` "Contact CarShop" → `/#contact`.
6. Editorial/craftsmanship presentation per `docs/design/` (no generic SaaS
   contact card grid; no decorative icons).
7. Record the CARSHOP-149 FU-5 obsolescence for `task-manager` (action only
   with user validation).
8. Tests (Vitest/RTL): `#contact` section (anchor always present, heading,
   CTAs, social links present/absent, absence of `tel:`/`mailto:`/address/
   hours), Home composition order, updated tests for `HomeCtaActions`,
   header, mobile nav, `HomeServices`, `/contact` (enabled "Get a Quote"
   link with `href="/#contact"`, no "coming soon" label). Coverage ≥ 80% on
   new/changed code. `lint`, `typecheck`, `build` pass; dev server
   validation on mobile/tablet/desktop (own port, without killing the
   user's dev server).

## Out of scope

- Quote/contact form that submits data; any new endpoint, Next Route
  Handler, e-mail provider or third-party form service.
- Inventing phone, e-mail, address, hours, service area, WhatsApp, prices,
  response times or "free quote" claims; copying DreamUP data, form, copy
  or layout.
- Backend changes; changing env values.
- Other anchors / converting nav links to anchors (CARSHOP-162); nav
  "Contact" stays `/contact`.
- Visual changes to Hero, Services, FeaturedWorks, Reviews beyond the CTA
  targets above.

## Acceptance (DoD, condensed — see Notion)

- `#contact` section integrated into the Home, always rendered, clear CTA.
- Only real/approved CarShop channels and data; nothing invented.
- Existing contact pieces reused (FinalCta evolved, `/contact` pieces
  shared), not duplicated.
- No invented endpoint; per business decision, contact happens through the
  existing channels (no quote backend dependency).
- Form requirements (item 6): N/A (no endpoint).
- "Get a Quote" (Hero, FinalCta, `/contact`, header, mobile menu) and
  Services CTA point to `/#contact`.
- Responsive, accessible, SEO preserved; tests, lint, typecheck, build pass.

## Size classification

**NON-TRIVIAL** — multiple areas (Home composition, shared `HomeCtaActions`,
global header/mobile nav, `HomeServices`, `/contact`), supersedes several
prior user-validated decisions site-wide, and requires architectural
decisions (shared-component boundary across route folders, server-only
social links on the Home, self-referencing CTA, focus behavior).

Next agents:

- `knowledge-reader` — done (points incorporated above).
- `architect` — required (confirm inventory; decide "Remaining points").
- `plan-writer` — required (`specs/CARSHOP-171/plan.md`).
