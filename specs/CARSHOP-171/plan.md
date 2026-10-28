# CARSHOP-171 — Implementation plan: Public Home Contact section (`#contact`)

Task classified as **NON-TRIVIAL** by the `spec-writer`
(`specs/CARSHOP-171/spec.md`). This plan persists the `architect` decision
and the final user copy decisions as actionable, verifiable steps for the
`developer`. No new architectural decision is introduced here.

Branch: `feat/CARSHOP-171`.

No Figma: the authoritative visual source is `docs/design/*` plus the current
Home direction (CARSHOP-144/161/167/170). CARSHOP-162 (general anchor
navigation) is **out of scope — do not pre-implement**; only `#contact` is
created here.

## User decisions (binding)

From the spec ("Approved user decisions"):

1. Channels: only real social links via `getSocialLinks()`, a link to
   `/contact`, and "View Our Work" (`/portfolio`). No phone, e-mail,
   address, hours, WhatsApp or service area. DoD item 6 (form) is **N/A**.
2. "Get a Quote" enabled everywhere as a `next/link` to `/#contact`
   (`HomeCtaActions`, header, mobile menu).
3. `FinalCta` evolves into the `#contact` section (no duplicate section).
4. Only the `#contact` anchor. `HomeServices` "Contact CarShop" →
   `/#contact`. Nav "Contact" stays `/contact`.

Final copy decisions (close the spec's open questions):

- **COPY-1**: keep the label "Get a Quote" (header, mobile nav,
  `HomeCtaActions`). Accessible name = visible text; drop "(coming soon)".
- **COPY-2**: **remove** the `/contact` sentence "Quote requests are coming
  soon. In the meantime, see our completed work." — no replacement text.
- **COPY-3**: the link to `/contact` inside `#contact` uses the existing
  approved text "Contact CarShop".
- **COPY-4**: no supporting sentence in `#contact` (omitted).
- Never "Free", never response-time promises, never invented contact data.

## Superseded decisions (do not treat as drift)

CARSHOP-143, CARSHOP-144 §3, CARSHOP-147 §5 (disabled "Get a Quote"),
CARSHOP-167 §2 (Services CTA → `/contact`). CARSHOP-149 FU-5 becomes
obsolete. Still valid: CARSHOP-144 (no "Free", no response-time promises),
CARSHOP-133/22 (no placeholder social links).

## Architect decision (source of truth — do not reinterpret)

### 1. `FinalCta` → `#contact`

- Keep name and file `app/(public)/_components/final-cta.tsx`.
- Server Component, **always rendered**, never depends on the works API.
- Signature:
  `FinalCta({ socialLinks }: Readonly<{ socialLinks: readonly SocialLink[] }>)`
  (`SocialLink` via `import type` from `@/lib/social-links`).
- `app/(public)/page.tsx` calls `getSocialLinks()` (sync, server-only) and
  passes the result as a prop — **not** inside `Promise.allSettled`.
- Root: `PageSection spacing="standard" id="contact" tabIndex={-1}
  aria-labelledby="home-contact-heading" className="border-t border-border
  outline-hidden"`; keep the current background.
- Hierarchy (DOM order):
  1. `h2#home-contact-heading` "Ready to transform your interior?"
     (text unchanged; id changes from `final-cta-heading`).
  2. Actions: `HomeCtaActions showQuoteLink={false}` ("View Our Work") +
     text link "Contact CarShop" → `/contact`, following the
     `home-services.tsx` link pattern (`min-h-11`, `text-nav`,
     `LuArrowRight` `aria-hidden`).
  3. `ContactFollowLinks headingLevel={3}`.
- Layout **with** social links: `grid grid-cols-1 gap-12 lg:grid-cols-12
  lg:items-start lg:gap-8`; left `lg:col-span-7`; right
  `lg:col-span-4 lg:col-start-9`.
- Layout **without** social links: single column `max-w-4xl`; channels block
  omitted entirely, no placeholder.
- Mobile: stacked in DOM order, `flex-wrap` actions, targets ≥ 44px, **no**
  CSS `order`. No image.

### 2. `HomeCtaActions` (`app/(public)/_components/home-cta-actions.tsx`)

- "Get a Quote" becomes
  `<Button asChild variant="outline" size="lg" className="h-11 px-6"><Link href="/#contact">Get a Quote</Link></Button>`.
- Remove `disabled`, `aria-disabled`, `aria-label`.
- Add additive prop `showQuoteLink?: boolean` (default `true`).
- Update the file comment that references CARSHOP-143.
- Effects: Hero, `/contact`, `/services` get the link; `#contact` hides it.

### 3. Header (`components/layout/header.tsx`, Server Component)

`<Button asChild variant="default"><Link href="/#contact">Get a Quote</Link></Button>`.
Static href; **do not** import `getSocialLinks`.

### 4. Mobile nav (`components/layout/mobile-nav.tsx`)

`Link` inside `Button asChild className="w-full"` with
`onClick={() => setIsOpen(false)}`.

### 5. `HomeServices` (`app/(public)/_components/home-services.tsx`)

Only `href` `/contact` → `/#contact`; text unchanged.

### 6. Navigation

Nav "Contact" stays `/contact` (`components/layout/nav-links.ts` untouched).

### 7. Move `ContactFollowLinks`

- Move `app/(public)/contact/_components/contact-follow-links.tsx` (+ test)
  to `components/contact/contact-follow-links.tsx` (+ test).
- Add prop `headingLevel: 2 | 3` (default `2`); keep the fixed id.
- `SocialLink` via `import type` from `@/lib/social-links`.
- Update the `/contact` page import; remove the COPY-2 sentence from
  `app/(public)/contact/page.tsx`.

### 8. Hash navigation / focus

- Always `next/link` `href="/#contact"`.
- No `scroll-mt-*` (header non-sticky), no global `scroll-smooth`.
- **Mandatory dev-server check** (own port; never kill the user's dev
  server): keyboard-only, after navigating to `/#contact` from the Home,
  from `/contact` and from the mobile menu, the next `Tab` must land on the
  first control inside `#contact`.
- **Stop condition**: if Next.js does not move focus to the section, do
  **not** add a client focus hook on your own — return to the `architect`.

### 9. Docs

`docs/rules/rendering.md`: Home row notes that social links are resolved
server-side from env (static).

### 10. Source conflict (recorded)

`docs/design` asks for "GET A FREE QUOTE" + phone/address/hours. CARSHOP-144
and the user decision prevail (no "Free", real data only). The `reviewer`
must not treat this as visual drift.

Out-of-scope debt (do not touch): `components/layout/footer.tsx`
duplicating social links; `HomeCtaActions` location in
`app/(public)/_components`.

## Files to touch

| File | Change |
| --- | --- |
| `app/(public)/contact/_components/contact-follow-links.tsx` → `components/contact/contact-follow-links.tsx` | `git mv`; add `headingLevel: 2 \| 3` (default 2); `import type { SocialLink }` |
| `app/(public)/contact/_components/contact-follow-links.test.tsx` → `components/contact/contact-follow-links.test.tsx` | `git mv`; add headingLevel 2/3 cases |
| `app/(public)/contact/page.tsx` | New import path; remove COPY-2 sentence |
| `app/(public)/contact/page.test.tsx` | Quote is link to `/#contact`; coming-soon sentence absent |
| `app/(public)/_components/home-cta-actions.tsx` | Quote as link; `showQuoteLink` prop; comment update |
| `app/(public)/_components/home-cta-actions.test.tsx` | Rewrite |
| `app/(public)/_components/final-cta.tsx` | `#contact` section per §1 |
| `app/(public)/_components/final-cta.test.tsx` | Rewrite per required tests |
| `app/(public)/page.tsx` | `getSocialLinks()` → `<FinalCta socialLinks={...} />` |
| `app/(public)/page.test.tsx` | Mocks, heading id, order, degraded cases, quote link (~line 175) |
| `components/layout/header.tsx` / `header.test.tsx` | Quote link `/#contact` |
| `components/layout/mobile-nav.tsx` / `mobile-nav.test.tsx` | Quote link; closes panel on click |
| `app/(public)/_components/home-services.tsx` / `home-services.test.tsx` | `href="/#contact"` |
| `app/(public)/services/page.test.tsx` | Update quote expectation (~line 29) |
| `app/(public)/_components/home-hero.test.tsx` | Update quote expectation (~line 78) |
| `docs/rules/rendering.md` | Home row note (§9) |

## Implementation order

1. **Move `ContactFollowLinks`** (+ test) with `git mv` to
   `components/contact/`; add `headingLevel`; update the `/contact` import.
   Run the moved test and `contact/page.test.tsx` — green, no behavior
   change yet.
2. **`HomeCtaActions`**: enable the quote link, add `showQuoteLink`; rewrite
   its test; update `home-hero.test.tsx`, `services/page.test.tsx`,
   `contact/page.test.tsx` expectations.
3. **`/contact` copy**: remove the COPY-2 sentence; assert its absence.
4. **Header + mobile nav**: quote link to `/#contact`; mobile closes on
   click; update tests.
5. **`HomeServices`**: href → `/#contact`; update test.
6. **`FinalCta` → `#contact`** + test.
7. **Home composition** (`page.tsx`: `getSocialLinks()` prop) + update
   `page.test.tsx`.
8. **Docs**: `docs/rules/rendering.md` note.
9. **Validation**: `lint`, `typecheck`, `test` (coverage ≥ 80% on
   new/changed code), `build`; then dev-server validation including the
   focus check (§8 stop condition).

## Required tests (Vitest + RTL)

- `final-cta.test.tsx`:
  - `section#contact` always present, `tabIndex=-1`;
  - single `h2` labeling the region (`aria-labelledby="home-contact-heading"`);
  - "View Our Work" → `/portfolio`; "Contact CarShop" → `/contact`;
  - **no** "Get a Quote" inside the section;
  - with social links: list present, links `target="_blank"`,
    `rel="noreferrer"`, sr-only text, `h3` heading;
  - without social links: no list, no `h3`, single-column layout;
  - absence of `tel:`, `mailto:`, address, hours, "free", "coming soon".
- `app/(public)/page.test.tsx`:
  - mock `server-only` and `@/lib/social-links`;
  - `final-cta-heading` → `home-contact-heading` (3 occurrences);
  - order Hero → Services → Works → Reviews → Contact;
  - `#contact` present when the API fails / no works;
  - update the test at ~line 175 (Quote is a link to `/#contact`).
- `home-cta-actions.test.tsx`: rewrite (link `/#contact`, accessible name
  "Get a Quote", no `aria-disabled`; `showQuoteLink={false}` hides it).
- `header.test.tsx`, `mobile-nav.test.tsx`: link `/#contact`; mobile click
  closes the panel (`aria-expanded="false"`).
- `home-services.test.tsx`: `href="/#contact"`; still no "Get a Quote".
- `contact/page.test.tsx`: Quote link; coming-soon sentence absent.
- `services/page.test.tsx` (~line 29), `home-hero.test.tsx` (~line 78):
  updated expectations.
- Moved `contact-follow-links.test.tsx` + `headingLevel` 2/3.

## Dev server validation

Dedicated port; stop only the process the agent started. Verify:

- Home ends with `#contact`: heading, "View Our Work", "Contact CarShop",
  social channels (when configured); no "Get a Quote" inside the section.
- Layout at mobile / `md` / `lg` (two columns on `lg` with socials; single
  column without).
- "Get a Quote" in header, mobile menu, Hero, `/contact`, `/services` goes
  to `/#contact`; mobile menu closes.
- Keyboard focus check per §8 (stop condition applies).
- `/contact` no longer shows the coming-soon sentence.

## Risks / dependencies (record only — do not act)

1. Focus on `/#contact` relies on App Router focus behavior (§8).
2. `task-manager` (only with explicit user validation): mark CARSHOP-149
   FU-5 as obsolete.

Resolved by the user (no action):

- **No quote backend dependency** — business decision: customers reach out
  through the contact channels and the communication team talks to them
  directly. No quote form or endpoint is planned; nothing is registered.
- **Social env values** — the production `SOCIAL_*_URL` values have been
  updated by the user (previous LinkedIn link-aggregator risk resolved).

## Constraints

- No `any`, `as any`, `@ts-ignore`, `@ts-expect-error` or unsafe casts.
- No invented endpoints, contact data, claims or copy beyond the approved
  COPY decisions.
- No secrets or `.env` values in code, tests, logs or docs.
- Do not commit unless the user explicitly asks.
