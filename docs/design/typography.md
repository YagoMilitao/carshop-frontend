# CarShop Typography System

## Purpose

This document defines the typography system for the CarShop frontend.

Typography is a core part of the CarShop visual identity.

It must reinforce:

- automotive craftsmanship;
- confidence;
- precision;
- authenticity;
- readability;
- strong editorial hierarchy.

Typography must not be selected independently for each page or component.

All frontend agents must follow this system unless an approved Figma design or explicit design decision overrides it.

---

# Typography Direction

The CarShop typography system combines:

**Barlow Condensed**

for expressive automotive and editorial typography.

with:

**Manrope**

for readable interface and content typography.

The combination should communicate:

> American Automotive Craftsmanship

without making the website feel like:

- a racing website;
- a sports brand;
- a generic SaaS product;
- a luxury fashion website;
- a mechanic shop template.

---

# Primary Typeface

## Barlow Condensed

Primary usage:

- Hero headlines
- Section headings
- Project titles
- Large statistics
- Editorial labels when appropriate
- Strong CTA statements
- Marketing display text

Barlow Condensed provides the visual personality of CarShop.

Its condensed structure allows large automotive headlines without consuming excessive horizontal space.

Example:

CUSTOM AUTOMOTIVE  
INTERIORS BUILT  
TO LAST.

---

# Secondary Typeface

## Manrope

Primary usage:

- Body text
- Navigation
- Buttons
- Forms
- Labels
- Metadata
- Captions
- Testimonials
- Administrative UI
- Supporting text

Manrope provides readability and balance against the stronger display typography.

It should remain neutral enough to let photography and Barlow Condensed create the visual personality.

---

# Font Responsibilities

Do not use both fonts interchangeably.

## Barlow Condensed communicates

- impact;
- craftsmanship;
- confidence;
- automotive personality;
- editorial hierarchy.

## Manrope communicates

- information;
- clarity;
- interaction;
- usability;
- supporting content.

---

# Public Website Typography

The public website should use stronger typographic contrast than the admin interface.

Large headings are encouraged.

However, large typography must always support hierarchy.

Do not make text large only for visual effect.

---

# Display Scale

The following values describe the intended hierarchy.

Implementation may use responsive CSS functions such as `clamp()` rather than fixed values when appropriate.

---

## Display XL

Use for:

- homepage hero;
- major campaign-level statements.

Desktop target:

72px–104px

Tablet target:

56px–80px

Mobile target:

44px–60px

Font:

Barlow Condensed

Recommended weight:

600–700

Line height:

0.88–0.98

Letter spacing:

-0.01em to 0

Example:

CUSTOM AUTOMOTIVE  
INTERIORS BUILT  
TO LAST.

Display XL should be rare.

Normally one major use per page.

---

## Display LG

Use for:

- major section statements;
- final CTA;
- large editorial messaging.

Desktop target:

56px–72px

Mobile target:

38px–48px

Font:

Barlow Condensed

Weight:

600–700

Line height:

0.95–1.05

Example:

CRAFTED FOR YOUR CAR.  
BUILT FOR THE ROAD.

---

## Heading 1

Use for:

- primary page titles;
- Portfolio;
- Services;
- About;
- Project Details.

Desktop target:

48px–64px

Mobile target:

36px–44px

Font:

Barlow Condensed

Weight:

600–700

Line height:

1.0–1.1

---

## Heading 2

Use for:

- primary sections;
- content groups.

Desktop target:

36px–48px

Mobile target:

30px–36px

Font:

Barlow Condensed

Weight:

600

Line height:

1.05–1.15

---

## Heading 3

Use for:

- service names;
- project names;
- subsection titles.

Desktop target:

26px–32px

Mobile target:

24px–28px

Font:

Barlow Condensed

Weight:

600

Line height:

1.1–1.2

---

## Heading 4

Use for:

- smaller content headings;
- card titles when cards are appropriate;
- supporting titles.

Target:

20px–24px

Font:

Barlow Condensed or Manrope depending on context.

Use Barlow Condensed when the heading is editorial.

Use Manrope when the heading belongs primarily to interface structure.

---

# Body Scale

## Body Large

Use for:

- hero supporting text;
- important introduction paragraphs;
- service introductions;
- project descriptions.

Desktop:

18px–20px

Mobile:

17px–18px

Font:

Manrope

Weight:

400

Line height:

1.6

---

## Body

Default content typography.

Size:

16px

Font:

Manrope

Weight:

400

Line height:

1.6–1.7

Use for:

- paragraphs;
- descriptions;
- testimonials;
- informational content.

---

## Body Small

Size:

14px

Font:

Manrope

Weight:

400–500

Line height:

1.5

Use for:

- supporting metadata;
- secondary information;
- captions.

Do not use Body Small for important content merely to save space.

---

# Labels

Labels may use:

Manrope

or, for editorial contexts:

Barlow Condensed.

Recommended size:

12px–14px

Weight:

600

Letter spacing:

0.06em–0.12em

Uppercase may be used intentionally.

Example:

OUR WORK

RESTORATION

CUSTOM INTERIORS

BEFORE

AFTER

Labels should not appear everywhere.

They are hierarchy tools.

---

# Navigation

Font:

Manrope

Recommended size:

14px–16px

Weight:

500–600

Navigation should feel precise and restrained.

Example:

SERVICES

OUR WORK

ABOUT

CONTACT

Uppercase navigation is allowed when it supports the final visual direction.

Avoid excessive letter spacing.

---

# Buttons

Font:

Manrope

Recommended size:

14px–16px

Weight:

600–700

Buttons may use uppercase when appropriate for the public visual identity.

Example:

GET A QUOTE

VIEW OUR WORK

VIEW ALL PROJECTS

Button typography should feel intentional and confident.

Do not use Barlow Condensed simply to make buttons look more automotive.

Interaction readability has priority.

---

# Statistics

Large trust statistics may use Barlow Condensed.

Example:

20+

YEARS OF  
CRAFTSMANSHIP

Possible hierarchy:

Number:

48px–72px  
Barlow Condensed  
600–700

Supporting label:

12px–14px  
Manrope  
600  
uppercase

Statistics should only use real business information.

Never fabricate numbers for visual purposes.

---

# Testimonials

Testimonials should prioritize readability.

Quote:

Manrope  
18px–24px  
400–500  
line-height 1.5–1.6

Customer information:

Manrope  
14px–16px  
500–600

Do not use oversized quotation marks as decoration unless explicitly approved by the design direction.

---

# Project Titles

Portfolio project titles should use:

Barlow Condensed

Recommended:

28px–40px

Weight:

600

The project photography should remain visually dominant.

Do not allow typography to cover important upholstery details unless the composition intentionally supports it.

---

# Text Width

Long paragraphs must not span the entire desktop viewport.

Recommended reading width:

approximately 55–75 characters per line.

Use constrained content widths.

Large screens should create more whitespace rather than excessively long text lines.

---

# Line Height

Display typography:

0.88–1.1

Headings:

1.0–1.2

Body:

1.5–1.7

Labels:

1.2–1.4

Do not apply one global line-height to all typography.

---

# Letter Spacing

## Display

Use neutral or slightly tight tracking.

Recommended:

-0.02em to 0

Do not excessively compress Barlow Condensed.

It is already a condensed typeface.

---

## Body

Use normal tracking.

Recommended:

0

Readability has priority.

---

## Uppercase Labels

May use increased tracking.

Recommended:

0.06em–0.12em

Use sparingly.

---

# Uppercase Usage

Uppercase is part of the CarShop visual language but must not dominate all text.

Good uses:

- navigation;
- labels;
- CTAs;
- large automotive headlines;
- statistics labels.

Bad uses:

- long paragraphs;
- testimonials;
- descriptions;
- form help text;
- error messages.

---

# Responsive Typography

Typography must scale fluidly.

Avoid creating many breakpoint-specific font sizes when CSS fluid typography can express the same hierarchy.

Preferred approach when appropriate:

`clamp(minimum, fluid, maximum)`

Example concept:

Display typography should scale between mobile and desktop rather than abruptly changing at arbitrary breakpoints.

The exact implementation belongs to the frontend implementation layer.

This document defines intent.

---

# Mobile Rules

Mobile typography must preserve the CarShop personality.

Do not drastically shrink display typography simply to fit everything on one line.

Line breaks are allowed and encouraged.

Example:

CUSTOM  
AUTOMOTIVE  
INTERIORS  
BUILT TO LAST.

may be stronger than forcing the entire sentence into fewer lines.

However, avoid unnatural line breaks that damage reading comprehension.

---

# Intentional Line Breaks

Marketing headlines may contain intentional line breaks.

Agents must consider line breaks part of the composition.

Do not automatically remove them during implementation.

Desktop and mobile may use different intentional line breaks when necessary.

---

# Hierarchy Rule

A page should not contain many elements competing at the same visual level.

Typical hierarchy:

Display

↓

Section Heading

↓

Supporting Text

↓

Content

↓

Metadata

The user should immediately understand what deserves attention.

---

# Typography and Photography

Typography must work with photography.

When text appears over an image:

- preserve sufficient contrast;
- avoid covering important craftsmanship details;
- avoid complex image areas behind text;
- use overlays only when necessary;
- maintain accessibility.

Do not darken every image simply because text needs to be placed over it.

The layout may instead position text outside the photograph.

---

# Typography and Motion

Typography animation must be restrained.

Allowed examples:

- subtle reveal;
- controlled entrance;
- line reveal;
- small opacity/position transitions.

Avoid:

- excessive character animations;
- constant movement;
- bouncing text;
- gimmicky effects;
- animation that delays content readability.

Respect reduced-motion preferences.

---

# Admin Typography

The admin interface prioritizes usability.

Use primarily:

Manrope

for:

- navigation;
- tables;
- forms;
- buttons;
- dialogs;
- filters;
- labels;
- data.

Barlow Condensed may be used sparingly for major page headings if visual continuity is desired.

Do not force public editorial typography into operational UI.

---

# Font Loading

Fonts must be loaded using the recommended Next.js font strategy.

Prefer:

`next/font`

when the selected font is available through the supported provider.

Goals:

- avoid unnecessary external runtime requests;
- minimize layout shift;
- use font subsets appropriately;
- preserve performance.

Do not add manual `<link>` font loading without evaluating the existing Next.js setup.

---

# Font Fallback

Provide appropriate fallback families.

Conceptually:

Barlow Condensed:

`"Arial Narrow", Arial, sans-serif`

Manrope:

`Arial, Helvetica, sans-serif`

The implementation must use the actual font configuration established in the project.

---

# Font Weight Rule

Do not load every available font weight.

Recommended starting set:

Barlow Condensed:

- 500
- 600
- 700

Manrope:

- 400
- 500
- 600
- 700

Only load weights actually used by the application.

---

# Accessibility

Typography must meet accessibility requirements.

Agents must verify:

- readable mobile sizes;
- sufficient contrast;
- adequate line height;
- visible interactive states;
- no important information communicated only through typography style;
- zoom compatibility;
- text remains usable at increased browser zoom.

Do not sacrifice readability to achieve an automotive aesthetic.

---

# Forbidden Typography Patterns

Do not:

- introduce new fonts per section;
- use more than the approved font families without explicit approval;
- use tiny body text;
- use extreme letter spacing;
- make every heading uppercase;
- use display typography for long paragraphs;
- create arbitrary font sizes;
- use font weights not included in the design system without reason;
- use decorative script fonts;
- imitate racing typography;
- use typography only because it looks "premium".

---

# Agent Rules

Before implementing typography, agents must:

1. Read `visual-direction.md`.
2. Read this document.
3. Check approved Figma when available.
4. Inspect the existing Next.js font configuration.
5. Reuse established typography tokens.
6. Avoid arbitrary Tailwind font-size values when a token already exists.
7. Preserve intentional headline line breaks.
8. Validate desktop and mobile hierarchy.
9. Validate accessibility.
10. Explain any deviation from this system.

---

# Recommended Typography Tokens

The final implementation may expose semantic tokens similar to:

`display-xl`

`display-lg`

`heading-1`

`heading-2`

`heading-3`

`heading-4`

`body-lg`

`body`

`body-sm`

`label`

`navigation`

`button`

These names describe meaning rather than arbitrary pixel values.

Agents should prefer semantic typography tokens over repeated custom utility combinations.

---

# Homepage Typography Mapping

## Hero

Barlow Condensed

Display XL

600–700

CUSTOM AUTOMOTIVE  
INTERIORS BUILT  
TO LAST.

---

## Hero Supporting Text

Manrope

Body Large

Upholstery · Restoration · Custom Work

---

## Hero CTAs

Manrope

Button

GET A QUOTE

VIEW OUR WORK

---

## Craftsmanship Statement

Barlow Condensed

Display LG

CRAFTED FOR YOUR CAR.  
BUILT FOR THE ROAD.

---

## Service Names

Barlow Condensed

Heading 3

RESTORATION

CUSTOM INTERIORS

REPAIRS

---

## Our Work

Barlow Condensed

Heading 2 or Display LG depending on composition.

---

## Project Titles

Barlow Condensed

Heading 3

---

## Before / After Labels

Manrope

Label

BEFORE

AFTER

---

## Why CarShop Statistics

Barlow Condensed for values.

Manrope for supporting labels.

---

## Testimonials

Manrope.

Readability has priority.

---

## Final CTA

Barlow Condensed

Display LG

READY TO TRANSFORM  
YOUR INTERIOR?

CTA button:

Manrope

GET A FREE QUOTE

---

# Final Principle

Typography is not decoration.

Barlow Condensed gives CarShop its automotive voice.

Manrope makes that voice usable.

Together they should communicate confidence, craftsmanship, and precision without turning the website into a racing brand or generic automotive template.