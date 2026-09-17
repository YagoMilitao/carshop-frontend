# CarShop Color System

## Purpose

This document defines the official color direction and semantic color system for the CarShop frontend.

Color must reinforce the approved visual concept:

**American Automotive Craftsmanship**

The palette should feel:

- automotive;
- industrial;
- warm;
- crafted;
- premium;
- confident;
- authentic.

Color must support photography and craftsmanship rather than compete with them.

Agents must never introduce arbitrary colors based on personal preference.

---

# Color Philosophy

CarShop uses a predominantly dark neutral palette with warm undertones.

The visual foundation combines:

- near-black;
- charcoal;
- warm dark surfaces;
- warm off-white;
- muted warm gray;
- leather-inspired cognac;
- restrained functional colors.

The palette intentionally avoids a cold technology/SaaS appearance.

---

# Primary Brand Accent

## Cognac Leather

Cognac is the primary expressive accent of the CarShop public experience.

Reference value:

`#B56A3B`

Cognac was selected because it visually connects the interface to:

- leather;
- craftsmanship;
- upholstery;
- stitching;
- classic automotive interiors;
- handmade materials.

It should feel like part of the business rather than a generic brand color.

---

# Important Accent Rule

Cognac is an accent.

It is NOT a background color for large portions of the interface.

It should be used selectively for:

- primary CTAs;
- small highlights;
- active states;
- selected elements;
- editorial details;
- restrained visual accents.

The majority of the interface remains neutral.

---

# Foundation Palette

## Near Black

Reference:

`#0C0C0C`

Role:

Primary page background.

Use for:

- main public website background;
- large dark sections;
- immersive photography sections;
- hero environments.

Avoid using absolute black `#000000` as the default background unless there is a specific visual reason.

Near-black provides depth without creating excessively harsh contrast.

---

## Charcoal

Reference:

`#151515`

Role:

Primary elevated surface.

Use for:

- secondary sections;
- navigation surfaces when necessary;
- content separation;
- elevated UI areas.

Charcoal should remain visually close to the main background.

Do not create large contrast jumps between dark surfaces.

---

## Warm Surface

Reference:

`#1C1B19`

Role:

Warm secondary surface.

Use selectively where a subtle material-like warmth improves the composition.

Possible uses:

- testimonials;
- craftsmanship content;
- quote/contact section;
- material-related sections.

Do not alternate surface colors mechanically between every section.

---

# Foreground Colors

## Warm White

Reference:

`#F4F0E8`

Role:

Primary foreground color.

Use for:

- headings;
- primary text;
- navigation;
- important labels.

Warm white is preferred over pure white because it complements the leather-inspired palette and reduces the cold digital feeling of pure black/white interfaces.

---

## Secondary Foreground

Reference starting point:

`#C8C3BA`

Role:

Secondary readable content.

Use for:

- supporting descriptions;
- less prominent information;
- project metadata.

Maintain accessible contrast.

---

## Muted Foreground

Reference starting point:

`#AAA59C`

Role:

Muted content.

Use for:

- metadata;
- captions;
- secondary labels;
- less important supporting information.

Muted text must remain readable.

Never reduce contrast merely to make the interface look sophisticated.

---

# Borders

## Default Border

Reference:

`#302E2A`

Use for:

- subtle separators;
- component boundaries;
- form controls;
- navigation separation;
- editorial lines.

Borders should normally be subtle.

---

## Strong Border

Reference starting point:

`#47433D`

Use when additional separation is required.

Examples:

- interactive hover states;
- focused visual groups;
- high-contrast dividers.

Do not outline every section.

Whitespace should provide most structural separation.

---

# Semantic Tokens

Implementation should use semantic tokens rather than raw colors scattered throughout components.

Conceptually:

`background`

`foreground`

`surface`

`surface-warm`

`muted`

`muted-foreground`

`border`

`border-strong`

`primary`

`primary-foreground`

`secondary`

`secondary-foreground`

`accent`

`accent-foreground`

`destructive`

`success`

`warning`

`focus-ring`

The exact implementation depends on the existing Tailwind/Shadcn configuration.

Agents must inspect the project before modifying tokens.

---

# Suggested Semantic Mapping

## background

Near Black

`#0C0C0C`

---

## foreground

Warm White

`#F4F0E8`

---

## surface

Charcoal

`#151515`

---

## surface-warm

Warm Surface

`#1C1B19`

---

## muted-foreground

Muted Warm Gray

`#AAA59C`

---

## border

Warm Dark Border

`#302E2A`

---

## primary

Cognac Leather

`#B56A3B`

---

## primary-foreground

Use a high-contrast dark foreground when accessibility testing confirms the combination.

Reference starting point:

`#0C0C0C`

The final combination must be contrast-tested.

---

# Cognac Usage

Cognac may be used for:

- primary CTA backgrounds;
- small active indicators;
- selected navigation accents;
- important links;
- subtle editorial details;
- controlled hover states;
- material-related visual accents.

---

# Cognac Forbidden Usage

Do not:

- color entire sections cognac without an approved composition;
- use cognac for large paragraphs;
- apply cognac to every icon;
- make every button cognac;
- create large gradients based on cognac;
- add glow effects;
- use it as decoration without purpose.

The accent becomes more powerful when it is rare.

---

# Automotive Red

Automotive red is NOT a primary CarShop brand color.

It may exist as a highly controlled supporting or semantic color.

Possible uses:

- destructive actions;
- errors;
- critical states;
- very specific approved automotive accents.

Do not introduce red simply because CarShop is an automotive business.

Avoid turning the interface into:

- racing aesthetics;
- performance branding;
- sports-car styling.

---

# Destructive

Use a dedicated accessible red.

The exact value should be defined after checking the existing component system and accessibility requirements.

Destructive color is reserved for:

- delete;
- destructive confirmation;
- critical error states.

Do not use cognac for destructive actions.

Brand and semantic meaning must remain separate.

---

# Success

Success should use a restrained accessible green.

Use for:

- successful form submission;
- confirmed admin actions;
- successful upload;
- positive system status.

Success green is functional.

It is not part of the public visual identity.

---

# Warning

Warning should use an accessible amber/yellow family.

Use for:

- warnings;
- pending operations;
- attention-required states.

Do not confuse warning colors with the cognac brand accent.

---

# Information

Do not automatically introduce SaaS blue for informational content.

Neutral presentation should be preferred when possible.

If an informational semantic color is required, it must be selected intentionally and accessibility-tested.

---

# Primary CTA

The primary CTA may use Cognac Leather.

Example:

GET A QUOTE

Possible conceptual treatment:

Background:

Cognac Leather

Foreground:

Near Black

Interaction:

Slightly lighter or darker cognac depending on tested contrast.

Avoid dramatic hover effects.

---

# Secondary CTA

Secondary actions should normally remain neutral.

Example:

VIEW OUR WORK

Possible treatment:

transparent background

Warm White foreground

subtle warm border

Hover may invert or slightly elevate contrast.

This creates clear hierarchy:

GET A QUOTE

is primary.

VIEW OUR WORK

is secondary.

---

# Text Links

Text links should not automatically become browser/SaaS blue.

Possible approaches:

- Warm White + underline;
- Cognac;
- subtle foreground transition.

Accessibility and discoverability remain mandatory.

---

# Header

The header should primarily use neutral colors.

Recommended starting point:

Background:

transparent or Near Black depending on hero composition.

Navigation:

Warm White / Secondary Foreground.

Primary CTA:

Cognac when appropriate.

Do not use multiple accent colors in navigation.

---

# Hero

The hero should primarily derive visual interest from:

- photography;
- typography;
- composition.

Not from decorative background colors.

Recommended:

Near Black

+

Warm White typography

+

Cognac primary CTA

+

automotive interior photography.

---

# Photography Interaction

Color must support photography.

Do not apply strong color overlays to every image.

Photography should retain realistic:

- leather tones;
- material texture;
- stitching colors;
- interior colors.

Avoid global filters that distort the actual quality of the upholstery.

---

# Image Overlays

When text requires additional contrast over photography, overlays may be used.

Prefer:

- subtle dark gradient;
- localized overlay;
- layout repositioning.

Avoid:

- heavy black filters over every image;
- cognac overlays;
- colored duotone effects;
- artificial automotive-red overlays.

The work must look authentic.

---

# Before & After

Before and after images must preserve realistic colors.

Do not color-grade one side differently to exaggerate the transformation.

The comparison should represent the real work.

---

# Section Rhythm

Do not mechanically implement:

Near Black

Charcoal

Near Black

Charcoal

for every section.

Section separation should come from:

- whitespace;
- photography;
- typography;
- borders;
- layout composition;
- occasional surface variation.

Background changes must have a compositional reason.

---

# Light Sections

The CarShop public experience is primarily dark.

However, warm light sections may be introduced intentionally.

Potential future light surface:

Warm Ivory

Reference starting point:

`#F4F0E8`

Foreground:

Near Black

Possible uses:

- editorial break;
- craftsmanship story;
- quote section;
- selected project storytelling.

Light sections must be deliberate.

Do not alternate dark/light sections mechanically.

---

# Dark Mode

The public CarShop website is designed with a dark-first visual identity.

This is not equivalent to a generic user-selectable "dark mode."

Do not automatically create a light theme solely because dark mode exists.

A light theme should only be introduced through an explicit product/design decision.

---

# Admin Colors

The admin interface may reuse the same semantic foundation but should prioritize operational clarity.

Admin may require stronger semantic colors for:

- status;
- moderation;
- errors;
- success;
- pending states;
- destructive actions.

Do not force the public site's minimal accent usage into workflows where semantic color improves usability.

---

# Comments Status Example

Admin moderation may require:

PENDING

APPROVED

HIDDEN

These states must use accessible semantic styling.

Do not assign colors based solely on aesthetics.

Meaning must remain understandable without color alone.

Use labels/text in addition to color.

---

# Accessibility

All foreground/background combinations must meet appropriate WCAG contrast requirements.

Agents must not assume a hex combination is accessible because it appears readable.

Contrast must be verified during implementation.

Especially validate:

- Cognac + foreground;
- Muted text + dark background;
- Border visibility;
- Form controls;
- Disabled states;
- Text over photography;
- Focus indicators.

---

# Focus Ring

Interactive keyboard focus must remain clearly visible.

Focus styling should fit the design system without becoming subtle to the point of invisibility.

Cognac may be considered for focus styling when contrast is sufficient.

Accessibility takes priority over visual minimalism.

---

# Disabled State

Disabled controls must remain recognizable.

Do not rely solely on very low opacity.

Disabled states should communicate:

- reduced emphasis;
- non-interactivity.

while preserving readability.

---

# Hover States

Hover should be restrained.

Preferred techniques:

- small background shift;
- border contrast shift;
- foreground change;
- subtle image scale when appropriate;
- subtle opacity transition.

Avoid:

- neon glow;
- large shadows;
- dramatic gradients;
- excessive color changes.

---

# Color and Motion

Do not animate through many colors.

Color transitions should be short and purposeful.

Examples:

- button hover;
- navigation hover;
- selected state.

Avoid decorative color animation.

---

# Color and Typography

Primary headings:

Warm White.

Supporting content:

Secondary or Muted Foreground.

Accent text:

Rare.

Do not make major headlines cognac by default.

Large Warm White typography against dark backgrounds should remain one of the strongest CarShop visual signatures.

---

# Color and Components

Components must consume semantic tokens.

Bad:

`bg-[#B56A3B]`

repeated throughout arbitrary components.

Preferred concept:

`bg-primary`

The design token determines the actual color.

This allows the system to evolve without rewriting individual components.

---

# Tailwind / Shadcn Integration

Before implementation, agents must inspect:

- existing global CSS;
- Tailwind configuration;
- Shadcn theme variables;
- CSS custom properties;
- existing semantic colors.

Do not create a second competing color system.

The approved CarShop colors should be integrated into the existing token architecture.

---

# Raw Hex Rule

Raw hexadecimal values should normally live only in:

- theme configuration;
- design tokens;
- centralized style definitions.

Avoid raw hex values inside individual React components.

Exceptions require justification.

---

# Arbitrary Tailwind Color Rule

Avoid implementation such as:

`bg-[#0C0C0C]`

`text-[#F4F0E8]`

`border-[#302E2A]`

inside application components when semantic tokens exist.

Prefer semantic utilities.

---

# Agent Rules

Before introducing or modifying color, agents must:

1. Read `visual-direction.md`.
2. Read this document.
3. Check approved Figma when available.
4. Inspect existing theme tokens.
5. Use semantic colors.
6. Validate accessibility.
7. Preserve photography authenticity.
8. Avoid arbitrary colors.
9. Avoid generic SaaS blue.
10. Avoid racing-red aesthetics.
11. Explain any new color introduced into the system.
12. Never introduce a new brand color silently.

---

# New Color Approval Rule

If an agent believes a new color is necessary, it must explain:

1. What semantic or brand purpose the color serves.
2. Why an existing token cannot solve the problem.
3. Where the color will be used.
4. Whether it is brand or semantic.
5. Accessibility considerations.
6. Impact on the existing palette.

The agent must not introduce the color automatically.

---

# Homepage Color Mapping

## Header

Background:

Transparent / Near Black depending on hero.

Navigation:

Warm White.

Primary CTA:

Cognac.

---

## Hero

Background:

Near Black.

Headline:

Warm White.

Supporting copy:

Secondary Foreground.

Primary CTA:

Cognac.

Secondary CTA:

Neutral/outlined.

Photography:

Natural colors.

---

## Craftsmanship Section

Primary background:

Near Black or intentionally selected warm surface.

Heading:

Warm White.

Supporting content:

Secondary Foreground.

---

## Services

Keep primarily neutral.

Photography and typography should provide differentiation.

Do not assign a different color to every service.

---

## Our Work

Neutral background.

Photography dominates.

Project titles:

Warm White.

Metadata:

Muted Foreground.

---

## Before & After

Neutral presentation.

BEFORE / AFTER labels:

Warm White or Secondary Foreground.

Images remain naturally colored.

---

## Why CarShop

Large statistics:

Warm White.

Small accents may use Cognac.

Supporting labels:

Muted or Secondary Foreground.

---

## Testimonials

Potential Warm Surface:

`#1C1B19`

Quote:

Warm White.

Supporting information:

Muted Foreground.

Stars may use a restrained warm accent when appropriate.

Do not use bright generic yellow without evaluating the composition.

---

## Final CTA

This section may carry stronger brand expression.

Possible direction:

Near Black or Warm Surface

+

large Warm White typography

+

Cognac CTA.

Avoid turning the entire section cognac by default.

---

## Footer

Near Black.

Primary information:

Warm White.

Secondary information:

Muted Foreground.

Links:

Warm White with intentional hover state.

---

# Initial Palette Reference

The following values establish the intended direction.

They are design-system starting points, not permission to scatter raw values throughout components.

Near Black:

`#0C0C0C`

Charcoal:

`#151515`

Warm Surface:

`#1C1B19`

Warm White:

`#F4F0E8`

Secondary Foreground:

`#C8C3BA`

Muted Foreground:

`#AAA59C`

Border:

`#302E2A`

Border Strong:

`#47433D`

Cognac Leather:

`#B56A3B`

Semantic success, warning, destructive, and information colors must be finalized through the component/theme implementation with accessibility validation.

---

# Final Principle

CarShop should feel warm without becoming rustic.

Dark without becoming generic.

Premium without becoming luxurious for the sake of luxury.

Automotive without becoming a racing brand.

Cognac connects the interface to the craft.

Photography provides the color.

The UI provides the structure.