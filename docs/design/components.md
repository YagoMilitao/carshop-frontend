# CarShop Component Design Rules

## Purpose

This document defines the visual and interaction rules for recurring CarShop frontend components.

The goal is not to create a rigid component library before implementation.

The goal is to ensure that recurring UI patterns remain visually consistent and support the approved CarShop design direction.

Agents must not create new component patterns casually.

Before creating a new component, inspect the existing system and determine whether an existing component can be reused or extended.

---

# Core Principle

A component must exist because it solves a recurring UI or interaction problem.

Do not create components only because:

- something looks visually grouped;
- there are three items side by side;
- a template commonly uses cards;
- Shadcn provides a component for it;
- another website uses it.

The public CarShop interface should feel editorial and photography-driven.

Not component-library-driven.

---

# Component Priority

Before creating a new component:

1. Inspect existing CarShop components.
2. Inspect approved Figma when available.
3. Read the relevant design documentation.
4. Determine whether the pattern is reusable.
5. Prefer extending an existing pattern over creating a visual duplicate.

---

# Public vs Admin Components

The public website and admin interface have different priorities.

## Public

Prioritize:

- brand;
- storytelling;
- photography;
- conversion;
- craftsmanship.

## Admin

Prioritize:

- clarity;
- efficiency;
- predictable interaction;
- forms;
- data management.

Do not force public editorial patterns into the admin.

Do not force admin dashboard patterns into the public site.

---

# Buttons

Buttons must have clear hierarchy.

The public website should generally use:

- Primary Button
- Secondary Button
- Text Action

Avoid creating many button variants.

---

## Primary Button

Use for the most important action in a section.

Examples:

GET A QUOTE

GET A FREE QUOTE

SUBMIT

SAVE

Recommended public treatment:

- Cognac background;
- high-contrast foreground;
- restrained radius;
- medium/strong weight;
- comfortable horizontal padding.

Avoid:

- gradients;
- glow;
- oversized shadows;
- excessive pill shape;
- animated color effects.

---

## Secondary Button

Use for important but secondary actions.

Example:

VIEW OUR WORK

Possible treatment:

- transparent;
- warm light foreground;
- subtle border;
- controlled hover.

Primary and secondary actions must remain visually distinct.

---

## Text Action

Use for lower-emphasis navigation or editorial actions.

Examples:

VIEW ALL PROJECTS →

LEARN MORE →

VIEW PROJECT →

Text actions may use:

- underline;
- arrow;
- subtle foreground change.

Avoid turning every text link into a button.

---

# Button Radius

Public buttons should generally use a restrained radius.

Avoid exaggerated pill shapes by default.

The exact value must align with the final token system.

Possible direction:

4px–8px

unless approved Figma defines otherwise.

---

# Button Motion

Allowed:

- subtle background change;
- slight foreground change;
- controlled arrow movement;
- small transform when approved.

Avoid:

- bounce;
- strong scaling;
- glow;
- spinning icons;
- dramatic hover animation.

---

# Navigation

Public navigation must remain visually simple.

Core items:

- Services
- Our Work
- About
- Contact

Optional primary CTA:

- Get a Quote

Navigation should not contain unnecessary menus if the site architecture does not require them.

---

# Desktop Header

Recommended structure:

Logo / Brand

↓

Navigation

↓

Optional CTA

The header should feel compact compared with the rest of the page.

Do not let navigation dominate the Hero.

---

# Mobile Navigation

Mobile navigation must prioritize usability.

Requirements:

- clear menu trigger;
- large touch targets;
- visible close action;
- keyboard accessibility;
- logical focus order;
- no hidden critical CTA.

Avoid overly complex animated full-screen menus unless justified.

---

# Section Heading

Create a reusable semantic pattern for section introductions.

Possible structure:

Eyebrow / Label

Heading

Supporting copy

Optional action

Example:

OUR WORK

SELECTED AUTOMOTIVE
INTERIORS

Projects built around craftsmanship, restoration, and custom detail.

VIEW ALL PROJECTS →

The exact layout may vary.

The hierarchy must remain consistent.

---

# Eyebrow / Label

Use sparingly.

Examples:

OUR WORK

SERVICES

BEFORE & AFTER

ABOUT CARSHOP

Possible style:

- Manrope;
- uppercase;
- compact;
- controlled letter spacing.

Do not add labels above every heading.

---

# Services

Important rule:

Services do not automatically become cards.

Bad default:

Three identical rounded cards with icons.

Preferred direction:

Editorial service list.

Example:

01

RESTORATION

────────────────────────

Complete interior restoration and repair.

→

02

CUSTOM INTERIORS

────────────────────────

Built around your vehicle and your vision.

→

03

REPAIRS

────────────────────────

Seats, headliners, panels and more.

→

The exact content must reflect real CarShop services.

---

# Service Interaction

Possible interaction on desktop:

Hover or focus on a service

↓

Associated photography changes

or

Photography receives emphasis

This pattern may be used only if:

- it remains accessible;
- content remains understandable without hover;
- mobile has an appropriate alternative.

Do not hide critical content behind hover.

---

# Project Presentation

The project itself is the main visual element.

Avoid making portfolio items look like generic ecommerce cards.

A project item may contain:

- project photography;
- project title;
- category;
- optional short metadata;
- view project action.

The image must remain dominant.

---

# Project Card Rule

The term "Project Card" may be used architecturally.

That does not mean the visual element must look like a conventional card.

Avoid by default:

- visible container background;
- rounded box;
- heavy shadow;
- border around every project.

Prefer:

Image

↓

Title

↓

Metadata

with open layout and whitespace.

---

# Portfolio Grid

Portfolio pages may use a grid when appropriate.

But the Home "Our Work" section should prefer stronger editorial hierarchy.

Possible composition:

Large featured project

+

Two supporting projects

rather than:

equal card / equal card / equal card

---

# Project Image Interaction

Allowed:

- subtle image scale;
- image reveal;
- controlled overlay;
- title movement;
- arrow movement.

Photography must remain readable.

Avoid excessive effects.

---

# Project Details

Project detail pages should support storytelling.

Potential reusable patterns:

- Project Hero
- Project Metadata
- Project Gallery
- Before & After
- Project Description
- Related Projects

Do not force all project content into cards.

---

# Gallery

Gallery components should prioritize image quality.

Possible layouts:

- editorial grid;
- masonry-like controlled layout;
- large image followed by details;
- alternating image sizes.

Avoid tiny thumbnails as the primary experience.

---

# Gallery Modal

If an image viewer is implemented:

Requirements:

- keyboard controls;
- close action;
- focus management;
- escape support;
- responsive images;
- accessible labeling.

Do not add a lightbox only for visual novelty.

---

# Before & After

Before & After is a key CarShop component.

Possible implementations:

## Side-by-Side

Desktop:

BEFORE | AFTER

Mobile:

stacked.

Simple and robust.

## Interactive Comparison

Slider revealing before and after.

Only use if:

- touch interaction is accessible;
- keyboard control exists;
- the interaction adds value;
- images are aligned appropriately.

Do not choose the slider simply because it looks impressive.

---

# Before & After Labels

Labels must remain visible.

Use:

BEFORE

AFTER

Do not rely only on user interpretation.

---

# Trust Signals

Examples:

20+ YEARS OF CRAFTSMANSHIP

PREMIUM MATERIALS

CUSTOM BUILT

Only use real verified business claims.

Visual treatment should prioritize:

- typography;
- spacing;
- simple separators.

Avoid unnecessary icon cards.

---

# Statistic Component

Potential structure:

20+

YEARS OF
CRAFTSMANSHIP

Value:

Barlow Condensed.

Description:

Manrope.

Do not invent statistics to fill space.

---

# Testimonials

Testimonials should look authentic.

Potential structure:

Rating

Quote

Customer Name

Vehicle / Project

Do not place every testimonial inside a large floating SaaS card by default.

Possible visual treatment:

- open layout;
- subtle divider;
- warm surface when appropriate.

---

# Ratings

Ratings may use stars.

Do not exaggerate them visually.

Never fabricate ratings.

If reviews come from an external source in the future, the UI must represent the actual source and data accurately.

---

# Business Information

Phone, address, and opening hours are important components for a local US business.

Potential structure:

PHONE

(XXX) XXX-XXXX

ADDRESS

Business address

HOURS

Mon–Fri ...

These details should be easy to find and interact with.

---

# Phone Interaction

When supported:

Phone numbers should use a telephone link.

Example behavior:

tap on mobile

↓

opens dialer.

Do not display phone numbers only as decorative text if they are actionable.

---

# Address Interaction

If appropriate:

Address may link to mapping/navigation.

Do not introduce external mapping behavior without confirming the actual address and business requirements.

---

# CTA Section

The Final CTA is a recurring marketing component.

Possible structure:

READY TO TRANSFORM
YOUR INTERIOR?

Supporting content

GET A FREE QUOTE

Business Information

The CTA must remain visually focused.

Do not place:

- social feeds;
- unrelated project cards;
- excessive navigation;

inside the same CTA section.

---

# Forms

Forms should prioritize clarity.

Typical fields may include:

- name;
- email;
- phone;
- vehicle information;
- message;
- project information.

The actual quote form fields must reflect real product requirements.

Do not invent business-required fields without approval.

---

# Input Style

Inputs should fit the industrial/editorial direction.

Prefer:

- dark neutral surface;
- visible border;
- clear label;
- strong focus state;
- readable value;
- clear validation.

Avoid:

- overly rounded pill inputs;
- glassmorphism;
- placeholder-only labels.

---

# Form Labels

Always use explicit labels.

Do not rely only on placeholders.

Labels support:

- accessibility;
- usability;
- clarity.

---

# Form Errors

Errors must be:

- specific;
- visible;
- accessible;
- located close to the relevant field.

Do not use color alone.

---

# Form Success

Submission success should clearly explain what happened.

Do not display only:

"Success"

Prefer meaningful feedback.

The exact copy must match the real submission workflow.

---

# Cards

Cards are allowed.

Cards are not forbidden.

But they require a functional reason.

Good card use cases:

- admin dashboard;
- moderation item;
- data summary;
- form grouping;
- repeated informational units that genuinely benefit from a boundary.

Bad public usage:

- wrapping every piece of content in a rounded rectangle.

---

# Icons

Icons should support comprehension.

Do not use decorative icons everywhere.

Prefer:

- arrows;
- navigation icons;
- functional form icons;
- clearly meaningful interaction icons.

Avoid generic:

- wrench icon;
- car icon;
- shield icon;
- star icon;

simply to make a section visually interesting.

Photography and typography should carry the public identity.

---

# Icon Style

Use one consistent icon library or visual style.

Do not mix:

- outlined icons;
- filled icons;
- emoji;
- custom illustration;

without explicit design reason.

---

# Arrows

Directional arrows may become part of the editorial interaction language.

Examples:

VIEW ALL PROJECTS →

VIEW PROJECT →

They should remain simple.

Avoid oversized decorative arrows.

---

# Dividers

Thin dividers may support the industrial/editorial aesthetic.

Use for:

- services;
- metadata;
- section separation;
- footer structure.

Avoid outlining entire layouts with borders.

---

# Badges

Badges should represent real semantic information.

Examples:

DRAFT

PUBLISHED

PENDING

APPROVED

These are mainly appropriate in admin.

Do not add marketing badges such as:

PREMIUM

BEST

TOP QUALITY

unless backed by actual content and requirements.

---

# Admin Table

Admin data listings may use tables.

Tables should prioritize:

- readability;
- sorting clarity;
- actions;
- status;
- responsive behavior.

Do not try to make admin tables editorial.

---

# Admin Status

Status components must include text.

Example:

PENDING

APPROVED

HIDDEN

Color may reinforce meaning.

Color must not be the only signal.

---

# Modal and Dialog

Use dialogs for focused actions such as:

- delete confirmation;
- destructive confirmation;
- selected admin workflow.

Avoid modal dialogs when a full page or inline flow would be clearer.

---

# Delete Confirmation

Destructive actions must require clear user intent.

Use:

- explicit item identification;
- destructive action label;
- cancel action.

Avoid vague text such as:

Are you sure?

Prefer:

Delete this project?

This action permanently removes the project and its associated data.

Exact copy must reflect actual backend behavior.

---

# Loading States

Loading should fit the content.

Public:

Prefer restrained skeletons or image placeholders.

Admin:

Skeletons, spinners, and progress feedback may be appropriate.

Avoid excessive animated loaders.

---

# Image Loading

Photography-heavy components must avoid abrupt layout shifts.

Use:

- known aspect ratios;
- appropriate Next Image sizing;
- placeholders where useful.

Performance must be considered part of visual quality.

---

# Empty States

Empty states should explain:

- what is missing;
- why;
- what action is possible.

Avoid generic illustrations unless they match the design system.

---

# Error States

Error UI should be calm and useful.

Explain:

- what failed;
- possible next step;
- retry action where relevant.

Do not use dramatic red screens.

---

# Component Radius

Public UI should use restrained corner radius.

Recommended direction:

small radius or square geometry.

Photography may use:

- no radius;
- subtle radius;

depending on final composition.

Admin may use more conventional Shadcn radii.

---

# Shadows

Public CarShop should use shadows sparingly.

Prefer:

- spacing;
- contrast;
- border;
- photography.

Avoid large soft SaaS shadows.

Admin components may use subtle elevation where appropriate.

---

# Component Motion

Motion must reinforce interaction.

Allowed:

- hover state;
- image scale;
- arrow shift;
- reveal;
- opacity transition;
- navigation transition.

Avoid:

- animation for every component;
- floating UI;
- looping motion;
- bounce effects;
- excessive scroll effects.

---

# Accessibility

Every interactive component must support:

- keyboard navigation;
- focus states;
- semantic HTML;
- sufficient contrast;
- appropriate labels;
- touch target sizing.

Hover interactions must have keyboard and mobile equivalents.

---

# Touch Targets

Interactive controls should generally provide at least an approximately 44x44px usable touch area when appropriate.

Visual elements may be smaller if the interactive target remains sufficiently large.

---

# Component States

Reusable interactive components should consider:

- default;
- hover;
- focus;
- active;
- disabled;
- loading;
- error;
- success;

when applicable.

Do not implement only the default screenshot state.

---

# Shadcn Rule

Shadcn/UI is an implementation foundation.

It is NOT the CarShop visual identity.

Agents may:

- reuse accessible primitives;
- adapt tokens;
- customize presentation.

Agents must not:

- accept default Shadcn appearance automatically;
- build the public site as a collection of untouched Shadcn examples.

---

# Component Naming

Prefer semantic names.

Good:

`ProjectPreview`

`SectionHeading`

`BeforeAfter`

`BusinessInfo`

`QuoteForm`

Avoid names based only on appearance:

`BlackBox`

`BigOrangeButton`

`FancyCard`

Components should describe responsibility.

---

# Agent Decision Checklist

Before creating a component, answer:

1. Does this pattern repeat?
2. Does it represent a meaningful UI responsibility?
3. Does an existing component already solve it?
4. Does it match the design direction?
5. Is a card actually necessary?
6. Is the component accessible?
7. How does it behave on mobile?
8. Does it introduce arbitrary styling?
9. Does it depend on real business data?
10. Can it evolve without duplicating design logic?

---

# Homepage Component Map

The approved Home direction may eventually use components conceptually similar to:

`PublicHeader`

`HeroSection`

`SectionHeading`

`ServicesSection`

`ServiceItem`

`FeaturedProjects`

`ProjectPreview`

`BeforeAfter`

`TrustStats`

`Testimonials`

`FinalQuoteCta`

`BusinessInfo`

`PublicFooter`

These are conceptual responsibilities.

Do not create all components automatically.

Implementation should determine the appropriate boundaries.

---

# Final Principle

The CarShop public website should not look like a collection of UI components.

It should feel like one continuous automotive story.

Components provide structure.

Photography provides proof.

Typography provides voice.

Craftsmanship remains the product.