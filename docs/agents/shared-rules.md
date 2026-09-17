# Shared Agent Rules

Shared rules for all official CarShop Frontend agents.

The authoritative registry of executable agents is:

`.claude/agents/`

This document defines behavior shared across those agents.

It does not define additional agents and must not be treated as an alternative agent registry.

Agent-specific responsibilities belong in each file under `.claude/agents/`.

Technical implementation rules belong in `docs/rules/`.

Visual rules belong in `docs/design/`.

Context-source rules belong in `docs/context/`.

---

## Official Agents

The official workflow agents are:

- `task-reader`
- `spec-writer`
- `knowledge-reader`
- `architect`
- `plan-writer`
- `developer`
- `tester`
- `reviewer`
- `task-manager`
- `knowledge-manager`

Do not invent another specialized agent when an existing agent already owns the responsibility.

If a task requires responsibility outside the current agent's scope, hand the concern to the appropriate existing agent.

---

## Responsibility Boundaries

Each agent must act only within its declared responsibility.

Do not silently absorb another agent's role for convenience.

Examples:

- `task-reader` reads task context;
- `spec-writer` defines the implementation specification;
- `knowledge-reader` retrieves relevant historical/project knowledge;
- `architect` makes architectural and structural decisions;
- `plan-writer` persists implementation plans when required;
- `developer` implements;
- `tester` validates behavior through tests;
- `reviewer` performs the final quality gate;
- `task-manager` manages allowed Notion task mutations;
- `knowledge-manager` preserves reusable project knowledge.

For UI work:

- `architect` owns structural visual decisions;
- `developer` owns visual implementation;
- `reviewer` owns visual compliance review.

These are responsibilities of the existing agents, not separate UI agents.

---

## Source of Truth

Agents must follow the source hierarchy defined in `CLAUDE.md`.

Never silently replace repository reality with documentation assumptions.

Never silently replace an approved decision with personal preference.

When relevant sources conflict:

1. identify the conflict;
2. explain its impact;
3. follow the project's source hierarchy;
4. escalate when the correct resolution requires user or architectural approval.

---

## Inspect Before Acting

Do not assume repository state.

Before making a decision or modification, inspect the sources required by the agent's role.

Depending on the task, this may include:

- current files;
- related components;
- `package.json`;
- task specification;
- plan;
- architectural decision;
- API contract;
- approved Figma;
- `docs/rules/`;
- `docs/design/`;
- `docs/context/`.

Do not invent missing information when it can be verified.

---

## Dependency Rule

Never assume a dependency is installed.

Confirm against the current repository, especially `package.json`, before:

- using a library;
- recommending implementation based on a library;
- writing tests with a library;
- requiring a library during review.

If a required dependency is missing, report it as a dependency or blocker according to the task context.

---

## Scope Control

Stay within the current task.

Do not turn focused work into unrelated:

- refactoring;
- redesign;
- architecture migration;
- dependency replacement;
- cleanup;
- documentation rewrite.

If unrelated debt is discovered, report it separately unless it directly blocks the current task.

---

## No Invented Contracts

Never invent:

- API endpoints;
- HTTP methods;
- request payloads;
- response structures;
- authentication behavior;
- database behavior;
- environment variables;
- external service contracts.

When a required contract is missing, report the dependency instead of fabricating an implementation.

---

## No Invented Business Information

Never invent production business information, including:

- testimonials;
- customer names;
- ratings;
- awards;
- addresses;
- phone numbers;
- business hours;
- years in business;
- project history;
- materials used;
- warranties;
- certifications;
- business claims.

When real content is unavailable, use clearly identified placeholders only when appropriate to the task.

---

## TypeScript Safety

Strict TypeScript is mandatory.

Never use:

- `any`;
- `as any`;
- `@ts-ignore`;
- `@ts-expect-error`;
- unsafe casts intended only to bypass type safety.

Type errors must be investigated rather than suppressed.

---

## Security

Never:

- expose secrets;
- print complete environment files;
- commit credentials;
- place tokens in documentation;
- log sensitive authentication data;
- weaken security controls for implementation convenience.

Environment-specific values must follow the repository's environment configuration rules.

---

## Language

All communication directed to the user must be in Brazilian Portuguese (`pt-BR`).

This includes:

- explanations;
- summaries;
- reports;
- questions;
- findings;
- implementation notes;
- review results.

Preserve the normal language of:

- code identifiers;
- filenames;
- APIs;
- library names;
- commands;
- external technical conventions.

Repository documentation is written in English unless the user explicitly requests otherwise.

This includes:

- `CLAUDE.md`;
- `.claude/agents/`;
- `docs/`.

---

## Evidence-Based Decisions

Agents must distinguish between:

- verified fact;
- project rule;
- architectural decision;
- requirement;
- inference;
- recommendation;
- personal preference.

Do not present inference as repository fact.

Do not present preference as requirement.

When evidence is insufficient, state the uncertainty.

---

## Existing Implementation First

Before proposing or creating something new, inspect whether the project already contains an appropriate:

- component;
- hook;
- service;
- schema;
- type;
- utility;
- provider;
- pattern;
- test helper;
- documentation source.

Prefer reuse when reuse preserves responsibility and maintainability.

Do not create parallel systems unnecessarily.

---

## Architecture Changes

Do not introduce architectural changes from an agent that does not own architectural decisions.

When implementation or testing reveals an architectural problem:

1. document the evidence;
2. explain the impact;
3. return the concern to the architectural decision process.

Do not silently rewrite the architecture.

---

## Design Changes

Do not redesign approved UI from an agent that does not own the decision.

For UI tasks:

- approved Figma provides screen-specific visual direction when available;
- `docs/design/` provides the CarShop Design System;
- `architect` defines structural strategy;
- `developer` implements it;
- `reviewer` validates it.

When implementation reveals a design conflict, report the conflict instead of silently inventing a different design.

---

## Accessibility

Accessibility is a shared quality requirement.

Agents must consider accessibility within their own responsibility rather than treating it exclusively as a final review concern.

Relevant considerations may include:

- semantic structure;
- keyboard interaction;
- focus;
- labels;
- alt text;
- contrast;
- responsive interaction;
- reduced motion;
- error communication.

---

## Performance

Performance must be considered when relevant to the agent's responsibility.

Focus on meaningful risks such as:

- unnecessary hydration;
- oversized client boundaries;
- excessive dependencies;
- image loading;
- LCP;
- CLS;
- duplicate requests;
- unnecessary state;
- avoidable rendering work.

Do not introduce speculative micro-optimizations without evidence.

---

## Comments and Documentation

Do not create documentation or comments merely to restate obvious code.

Document decisions when they preserve useful context such as:

- architectural constraints;
- non-obvious tradeoffs;
- API limitations;
- troubleshooting knowledge;
- accessibility decisions;
- unusual implementation behavior.

Reusable project knowledge belongs in the appropriate documentation or knowledge workflow.

---

## User Authority

The user retains final authority over:

- task completion;
- major scope changes;
- architectural changes requiring approval;
- product decisions;
- business information;
- creation of new tasks.

Agents must not imply user approval that was never given.

---

## Notion Task Status

Agents must follow the task-status workflow defined in `CLAUDE.md`.

A task must never be automatically moved to:

`Done`

Permanent approved exception:

After the `reviewer` approves the implementation with no blocking findings, the corresponding Notion task may automatically move to:

`Review`

Final completion remains the user's decision.

---

## New Task Creation

Do not create a new Notion task automatically.

If implementation reveals work outside the current scope:

1. describe the required follow-up;
2. explain why it is separate;
3. ask the user before creating a new task.

---

## Agent Creation

Do not create a new agent simply because a task has a specialized domain.

First determine whether the responsibility belongs to an existing agent.

New agents should only be considered when there is a genuinely distinct, recurring responsibility that cannot be cleanly assigned to the current workflow.

Avoid agent proliferation.

---

## Performance Tracking

Each workflow phase must be timed according to `CLAUDE.md`.

If one phase consumes more than 50% of the total task execution time, report:

`PERFORMANCE HOTSPOT`

Include:

- the phase;
- its percentage of total execution time;
- relevant reason when known.

Do not fabricate timing data.

---

## Forbidden Shared Behavior

No agent may:

- invent project facts;
- invent contracts;
- invent business information;
- expose secrets;
- bypass TypeScript safety;
- silently redesign approved UI;
- silently change architecture;
- silently expand task scope;
- assume dependencies;
- treat documentation as more current than verified repository reality;
- claim user approval that was not provided;
- mark a task `Done`;
- create new tasks without user authorization;
- create new agents merely for convenience.

---

## Final Principle

Keep responsibilities explicit.

Inspect before acting.

Use evidence instead of assumptions.

Respect source-of-truth hierarchy.

Respect agent boundaries.

Protect repository reality.

Protect project architecture.

Protect the Design System.

Protect user authority.