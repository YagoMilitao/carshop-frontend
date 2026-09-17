# CarShop Spacing & Layout System

## Purpose

This document defines spacing, layout rhythm, content width, gutters, and composition rules for the CarShop frontend.

Spacing is part of the visual identity.

It must support:

- automotive photography;
- strong typography;
- editorial composition;
- visual hierarchy;
- craftsmanship storytelling;
- responsive usability.

Agents must not assign arbitrary spacing values independently to every section.

---

# Core Principle

CarShop should feel spacious but not empty.

Whitespace must create:

- hierarchy;
- focus;
- rhythm;
- separation;
- visual confidence.

Whitespace is not unused space.

It is part of the composition.

---

# Editorial Rhythm

Public pages must not use identical vertical spacing for every section.

Bad:

Hero

80px

Services

80px

Portfolio

80px

Before & After

80px

Testimonials

80px

Footer

This creates mechanical rhythm.

CarShop should use intentional variation.

Example:

Hero

↓

Large transition

↓

Compact supporting section

↓

Large portfolio experience

↓

Medium transition

↓

Before & After

↓

Large trust section

↓

Final CTA

The exact values depend on viewport and composition.

---

# Base Spacing Scale

Prefer a consistent spacing scale.

Recommended conceptual scale:

4px

8px

12px

16px

24px

32px

48px

64px

80px

96px

128px

160px

Not every value must become a public design token.

The purpose is to avoid arbitrary values such as:

37px

53px

71px

unless a specific approved composition requires them.

---

# Micro Spacing

Use:

4px–12px

For relationships such as:

- icon and label;
- metadata;
- small form relationships;
- tightly related information.

Micro spacing communicates that elements belong together.

---

# Component Spacing

Use:

16px–32px

For:

- button groups;
- card content when cards are appropriate;
- form fields;
- navigation groups;
- content blocks.

---

# Content Spacing

Use:

32px–64px

For:

- heading to supporting paragraph;
- introduction to CTA;
- project title to metadata;
- groups of related content.

---

# Section Spacing

Use larger values:

64px–160px

depending on:

- section importance;
- viewport;
- photography;
- composition.

Public pages should generally have more vertical breathing room than administrative screens.

---

# Section Categories

Instead of assigning arbitrary padding per section, think in semantic section sizes.

## Section Compact

Use for tightly related transitions or supporting information.

Desktop starting range:

64px–80px

Mobile:

48px–64px

---

## Section Standard

Default major content section.

Desktop:

96px–128px

Mobile:

64px–80px

---

## Section Editorial

Used for major photography/storytelling sections.

Desktop:

128px–160px

Mobile:

80px–96px

Examples:

- Our Work;
- Before & After;
- major craftsmanship storytelling.

---

## Section Immersive

Reserved for highly important compositions.

Examples:

- Hero;
- major project introduction;
- selected campaign-like sections.

May use viewport-aware sizing rather than fixed padding.

Do not use immersive spacing everywhere.

---

# Container System

Not every element should occupy the full viewport width.

Use containers to maintain alignment.

Recommended conceptual maximum content width:

approximately 1280px–1440px.

The exact value should be finalized during implementation based on the existing layout architecture.

---

# Content Container

Used for:

- navigation;
- text;
- services;
- statistics;
- testimonials;
- footer information.

Conceptually:

max-width around 1280px–1440px

centered

with responsive gutters.

---

# Reading Container

Long-form text should use a narrower container.

Recommended:

approximately 640px–760px.

Use for:

- About copy;
- project descriptions;
- long service descriptions.

Do not stretch paragraphs across large desktop screens.

---

# Full-Bleed Content

Photography may intentionally escape the standard content container.

Allowed examples:

- Hero photography;
- portfolio photography;
- project gallery;
- Before & After;
- editorial image sections.

This creates visual contrast between structured content and immersive work.

---

# Full-Bleed Rule

Full-bleed should be intentional.

Do not make every section edge-to-edge.

Contrast between:

contained content

and

full-bleed photography

is part of the visual rhythm.

---

# Horizontal Gutters

Content must never touch viewport edges unintentionally.

Recommended starting direction:

Mobile:

20px–24px

Tablet:

32px–48px

Desktop:

48px–80px

Large Desktop:

64px–96px

The final values should be represented through reusable layout tokens.

---

# Mobile Gutters

Mobile should preserve comfortable spacing without wasting limited screen width.

Preferred starting point:

20px

or

24px

Avoid excessive mobile padding such as 32px on every container when it significantly reduces usable content width.

---

# Desktop Composition

Desktop layouts may use:

- asymmetry;
- offset images;
- oversized typography;
- overlapping visual planes when intentional;
- mixed image dimensions;
- controlled negative space.

Do not automatically center every element.

---

# Mobile Composition

Mobile should prioritize:

1. reading order;
2. photography;
3. CTA visibility;
4. comfortable interaction;
5. hierarchy.

Desktop asymmetry does not need to survive literally on mobile.

The composition may transform.

---

# Hero Layout

The Hero is an immersive section.

It should feel substantial immediately after page load.

Possible desktop composition:

Left:

- headline;
- supporting copy;
- CTAs.

Right:

- large automotive interior photograph.

The photograph may occupy approximately half or more of the visual composition depending on the final design.

---

# Hero Vertical Spacing

Do not create the Hero using only arbitrary top and bottom padding.

Consider:

- header height;
- viewport height;
- headline dimensions;
- photography ratio;
- CTA visibility.

The Hero may use viewport-aware sizing.

However:

Do not force `100vh` when it creates poor usability or hides important content below the fold.

---

# Hero Mobile Layout

Recommended order:

Headline

↓

Supporting copy

↓

Primary and secondary actions

↓

Photography

The image may also appear partially earlier depending on the approved composition.

The first viewport should clearly communicate what CarShop does.

---

# Hero Breathing Room

The Hero should not feel crowded.

Avoid placing:

- multiple badges;
- statistics;
- reviews;
- social links;
- service cards;
- several CTAs;

all inside the Hero.

The Hero has one primary responsibility:

Introduce CarShop and establish visual confidence.

---

# Section Heading Spacing

A section introduction may follow:

Label

↓

small gap

↓

Heading

↓

medium gap

↓

Supporting content

Example:

OUR WORK

24px relationship

SELECTED AUTOMOTIVE  
INTERIORS

32px–48px

Supporting copy

Exact spacing must follow the implemented token system.

---

# Services Layout

Services should not automatically become three identical cards.

Possible composition:

RESTORATION

CUSTOM INTERIORS

REPAIRS

with:

- typography;
- photography;
- dividers;
- staggered positioning;
- editorial alignment.

Spacing should communicate separation without excessive containers.

---

# Portfolio Layout

Our Work should have generous spacing.

Photography needs room to breathe.

Recommended composition principle:

one dominant image

+

supporting images

+

intentional negative space.

Avoid:

equal card

equal card

equal card

equal card

when an editorial layout better represents the work.

---

# Portfolio Image Gap

Image gaps may be smaller than major section gaps.

This creates visual grouping.

Example conceptual relationship:

Project gallery images:

16px–32px

Gallery to next major section:

96px–160px

This tells the user:

These images belong together.

The next section is a new idea.

---

# Before & After Layout

Desktop:

Before and After may sit side-by-side.

Mobile:

Stack vertically when necessary.

The gap should allow comparison without making the images feel unrelated.

Avoid excessive separation between Before and After.

---

# Statistics Layout

Trust signals should feel strong and simple.

Example:

20+ YEARS

PREMIUM MATERIALS

CUSTOM BUILT

Use spacing and typography rather than heavy cards.

Desktop may use horizontal distribution.

Mobile may stack or use a controlled grid.

---

# Testimonials

Testimonials require comfortable reading width.

Avoid placing long quotes across the entire viewport.

Use:

- constrained text width;
- generous vertical space;
- clear separation from customer metadata.

---

# Final CTA

The final CTA should have substantial breathing room.

It represents the last major conversion opportunity.

The section may use Section Editorial spacing.

Do not overcrowd it with unrelated information.

Primary content:

READY TO TRANSFORM  
YOUR INTERIOR?

GET A FREE QUOTE

Business information may follow with appropriate separation.

---

# Header Spacing

The header should feel precise and compact compared with editorial sections.

Recommended conceptual desktop height:

72px–88px.

Mobile:

64px–72px.

Exact implementation depends on the final navigation.

---

# Navigation Spacing

Navigation links should have enough separation to scan comfortably.

Avoid:

- excessive gaps;
- cramped links;
- huge desktop navigation spacing used only for decoration.

Navigation should remain functional.

---

# Buttons

Button internal spacing should be standardized.

Recommended conceptual starting point:

Horizontal:

20px–28px

Vertical:

12px–16px

Large public CTA may be slightly larger.

Do not create a unique button size for every section.

---

# Button Groups

Primary and secondary actions should remain visually related.

Desktop:

may sit horizontally.

Mobile:

may remain horizontal when space allows or stack intentionally.

Avoid accidental wrapping.

---

# Grid System

The public website may use a 12-column conceptual desktop grid.

This does not mean every component must explicitly implement twelve CSS columns.

The grid exists to help composition.

Examples:

Hero text:

5 columns.

Hero photography:

6–7 columns.

Editorial image:

8 columns.

Supporting image:

4 columns.

The exact composition may vary.

---

# Asymmetry

Controlled asymmetry is encouraged.

Examples:

- image extending farther than text;
- offset project image;
- headline occupying fewer columns than photography;
- uneven portfolio image sizes.

Asymmetry should feel intentional.

Random misalignment is not editorial design.

---

# Alignment Rule

Even asymmetrical layouts require shared alignment anchors.

Agents should identify:

- container edge;
- text edge;
- image edge;
- baseline;
- grid column.

Avoid arbitrary positioning.

---

# Relationship Rule

Spacing communicates relationships.

Small gap:

These things belong together.

Medium gap:

These things are related but distinct.

Large gap:

A new idea begins.

Agents must use this principle instead of choosing spacing based only on appearance.

---

# Avoid Excessive Containers

Do not place every content group inside:

- bordered boxes;
- rounded cards;
- elevated surfaces.

Whitespace can define structure.

This is especially important for the public website.

---

# Border Radius and Spacing

Large radius plus large internal padding frequently creates SaaS-style cards.

CarShop should prefer:

- open layouts;
- photography;
- lines;
- whitespace;
- restrained containers.

Containerization must have a functional or compositional reason.

---

# Admin Spacing

Admin spacing is more compact.

The admin interface prioritizes:

- efficiency;
- scanning;
- forms;
- data management.

Public editorial spacing should not be copied directly into admin screens.

---

# Responsive Spacing

Spacing should scale with viewport size.

Avoid maintaining desktop-sized section padding on mobile.

Likewise, avoid making large desktop sections feel cramped.

Responsive spacing should preferably be expressed through reusable tokens or consistent responsive utilities.

---

# Arbitrary Value Rule

Avoid arbitrary Tailwind spacing such as:

`mt-[73px]`

`gap-[37px]`

`py-[113px]`

unless an approved visual composition genuinely requires it.

Prefer design-system values.

---

# Semantic Layout Tokens

The implementation may define concepts similar to:

`container-page`

`container-reading`

`section-compact`

`section-standard`

`section-editorial`

`section-immersive`

`page-gutter`

`content-gap`

`cluster-gap`

The exact implementation should match the existing project architecture.

---

# Agent Rules

Before implementing layout or spacing, agents must:

1. Read `visual-direction.md`.
2. Read this document.
3. Check approved Figma when available.
4. Inspect existing layout utilities.
5. Use the established spacing scale.
6. Preserve intentional whitespace.
7. Avoid identical spacing across every section.
8. Avoid unnecessary containers.
9. Validate mobile composition separately.
10. Avoid arbitrary spacing values without justification.
11. Maintain clear alignment anchors.
12. Use spacing to communicate content relationships.

---

# Review Questions

Before approving a screen, ask:

- Does every section have the same vertical rhythm?

If yes, reconsider.

- Are there too many containers?

If yes, simplify.

- Does photography have enough room?

If no, reconsider the composition.

- Is there enough contrast between major and minor sections?

If no, adjust spacing hierarchy.

- Does mobile feel intentionally designed?

If no, redesign the mobile composition.

- Can spacing values be explained through the system?

If no, investigate arbitrary values.

---

# Homepage Spacing Mapping

## Hero

Immersive.

Large composition.

Viewport-aware.

---

## Craftsmanship

Standard to Editorial.

Strong transition from Hero.

---

## Services

Standard.

Keep services visually related.

---

## Our Work

Editorial.

Photography needs substantial breathing room.

---

## Before & After

Editorial.

Comparison remains visually connected.

---

## Why CarShop

Standard to Editorial.

Statistics need room to communicate confidence.

---

## Testimonials

Standard.

Constrain reading width.

---

## Final CTA

Editorial.

Large closing statement.

---

## Footer

Compact to Standard depending on business information.

The footer should not feel like another marketing section.

---

# Final Principle

Spacing creates rhythm.

Rhythm creates hierarchy.

Hierarchy creates confidence.

CarShop should feel intentionally composed, not mechanically spaced.

Photography needs room.

Typography needs room.

Craftsmanship needs room.