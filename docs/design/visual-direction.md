# CarShop Visual Direction

## Purpose

This document defines the visual direction for the CarShop public-facing experience.

It is a source of truth for AI agents, designers, and developers working on the frontend.

Agents must not redesign the product based on personal aesthetic preference.

When an approved Figma design exists, Figma has higher visual authority than this document.

---

## Business Context

CarShop represents a US-based automotive upholstery business specializing in automotive interior restoration and customization.

The website must feel like a real American automotive craftsmanship business.

It must not look like:

- a SaaS product;
- a generic startup landing page;
- an admin dashboard;
- a template marketplace website;
- a luxury dealership;
- a generic mechanic shop.

The visual experience should communicate:

- craftsmanship;
- precision;
- automotive culture;
- restoration;
- custom work;
- premium materials;
- trust;
- local expertise;
- durability.

---

## Brand Positioning

CarShop should feel:

**Premium, but approachable.**

**Automotive, but not aggressive.**

**Industrial, but refined.**

**Craft-focused, not corporate.**

**Modern, without losing the feeling of handmade work.**

The website should make visitors think:

> These people are extremely good at automotive interiors, and I would trust them with my car.

---

## Core Visual Keywords

Use these concepts when making visual decisions:

- Automotive
- Craftsmanship
- Custom
- Handmade
- Restoration
- Leather
- Precision
- Durable
- American workshop
- Authentic
- Confident
- Editorial
- Photography-first

---

## Primary Visual Concept

The visual direction is:

**American Automotive Craftsmanship**

The interface combines:

- dark industrial surfaces;
- warm leather-inspired accents;
- large automotive photography;
- bold condensed typography;
- strong visual hierarchy;
- restrained UI decoration;
- editorial layouts;
- authentic business information.

Photography and completed work should be the primary visual assets.

UI components must support the work rather than compete with it.

---

## Public Website Principles

### Photography First

Automotive interior photography is one of the most important elements of the website.

Whenever appropriate, prefer:

- large images;
- full-width photography;
- editorial image compositions;
- before/after comparisons;
- close-up craftsmanship details.

Avoid placing every image inside small cards.

---

### Strong Typography

Headings should feel confident and automotive.

Large headings are encouraged when they improve hierarchy.

Example:

CUSTOM AUTOMOTIVE  
INTERIORS BUILT  
TO LAST.

Typography should create personality without sacrificing readability.

---

### Controlled Color

The public website should primarily use:

- charcoal;
- near-black;
- warm off-white;
- neutral gray;
- leather-inspired accent colors.

Accent colors must be intentional.

Do not introduce arbitrary colors for individual components.

---

### Minimal Decorative UI

Avoid excessive:

- gradients;
- glassmorphism;
- floating cards;
- glowing borders;
- excessive shadows;
- pills;
- badges;
- rounded containers;
- decorative icons.

Decoration should never compete with automotive photography.

---

## Anti-SaaS Rule

The public CarShop website must not use SaaS dashboard visual language.

Avoid patterns such as:

- grids of identical rounded cards;
- excessive icon + title + description cards;
- blue primary buttons by default;
- generic gradient backgrounds;
- floating metric widgets;
- dashboard-like panels;
- excessive border-radius;
- glassmorphism;
- generic startup hero sections.

Cards are allowed only when they are the appropriate content structure.

---

## Shape Language

The public website should feel precise and engineered.

Prefer:

- restrained border radius;
- strong rectangular compositions;
- clear alignment;
- deliberate asymmetry where appropriate;
- large visual blocks;
- thin borders;
- editorial image layouts.

Avoid making every element rounded.

---

## Homepage Direction

The approved homepage direction is:

### Header

Navigation:

- Services
- Our Work
- About
- Contact

Primary CTA may be:

- Get a Quote

The header should be minimal and should not visually compete with the hero.

---

## Hero

Primary message:

CUSTOM AUTOMOTIVE  
INTERIORS BUILT  
TO LAST.

Supporting message:

Upholstery · Restoration · Custom Work

Primary CTA:

GET A QUOTE

Secondary CTA:

VIEW OUR WORK

The hero must include strong automotive interior photography.

The image should communicate craftsmanship immediately.

Avoid generic car exterior photography when interior craftsmanship is the subject.

---

## Craftsmanship Section

Headline:

CRAFTED FOR YOUR CAR.  
BUILT FOR THE ROAD.

Core services:

- Restoration
- Custom Interiors
- Repairs

This section should communicate expertise without becoming a generic three-card SaaS section.

Services may use photography, typography, editorial composition, or restrained content blocks.

---

## Our Work

The portfolio should be photography-driven.

Prefer an editorial composition such as:

- one dominant project;
- supporting smaller projects;
- varying image proportions;
- generous spacing.

Avoid a generic uniform card grid unless required by the portfolio browsing page.

CTA:

VIEW ALL PROJECTS →

---

## Before & After

Before/after work is an important trust and conversion element.

The design should make transformation immediately understandable.

Possible patterns include:

- side-by-side images;
- interactive comparison;
- stacked mobile comparison.

Do not hide the transformation behind unnecessary UI.

---

## Why CarShop

This section communicates trust.

Example signals:

20+ YEARS  
CRAFTSMANSHIP

PREMIUM  
MATERIALS

CUSTOM  
BUILT

Use strong typography and numbers.

Avoid generic feature cards with decorative icons.

---

## Testimonials

Customer testimonials are social proof.

The section should feel authentic and restrained.

Possible elements:

- customer quote;
- star rating;
- customer name;
- vehicle/project when available.

Do not fabricate testimonials.

If real customer information is unavailable, use clearly identified placeholders during development.

---

## Final CTA

Headline:

READY TO TRANSFORM  
YOUR INTERIOR?

Primary CTA:

GET A FREE QUOTE

Business information should be visible:

- phone;
- address;
- opening hours.

For a local US business, contact information is part of the conversion experience and must not be hidden only inside the footer.

---

## Public Page Experience

The public experience should prioritize:

1. Completed work
2. Craftsmanship
3. Services
4. Trust
5. Business credibility
6. Contact / quote conversion

The website is not primarily a software product.

The product is the craftsmanship.

---

## Admin Experience

The admin interface is exempt from some public-site visual rules.

Admin screens should prioritize:

- usability;
- speed;
- accessibility;
- clarity;
- predictable interaction.

Shadcn/UI patterns are more appropriate in the admin area.

The admin interface may use:

- cards;
- tables;
- dialogs;
- forms;
- badges;
- standard dashboard patterns.

Do not force the editorial public-site aesthetic into administrative workflows.

---

## Responsive Direction

Mobile must not be treated as a reduced desktop version.

On smaller screens:

- preserve strong typography;
- maintain photography prominence;
- reduce layout complexity;
- stack editorial compositions intentionally;
- maintain comfortable touch targets;
- avoid excessive horizontal padding;
- preserve CTA visibility.

Desktop layouts may use asymmetry.

Mobile layouts should prioritize reading order and usability.

---

## Accessibility

Visual personality must never override accessibility.

Maintain:

- sufficient color contrast;
- visible keyboard focus;
- semantic HTML;
- accessible interactive controls;
- readable font sizes;
- appropriate line height;
- descriptive image alt text;
- reduced-motion support when appropriate.

---

## Agent Rules

AI agents working on CarShop UI MUST:

1. Read this document before proposing public UI changes.
2. Check for approved Figma designs.
3. Read the relevant specialized documents under `docs/design/`.
4. Inspect existing components before creating new ones.
5. Preserve the approved CarShop visual language.
6. Prefer automotive photography over decorative UI.
7. Avoid generic SaaS patterns.
8. Explain significant deviations from the design direction.
9. Never copy a reference website directly.
10. Never invent brand identity based only on personal preference.

If requirements conflict with this document, the agent must surface the conflict instead of silently redesigning the product.

---

## Source Priority

When making visual decisions, use this priority:

1. Approved Figma
2. CarShop Design Direction and Design System
3. Approved visual references
4. Existing CarShop components
5. General design knowledge

Lower-priority sources must never silently override higher-priority sources.

---

## Final Principle

CarShop should not look like a developer portfolio pretending to be an automotive business.

It should look like a real automotive upholstery business that happens to have an excellent website.

The craftsmanship is the hero.