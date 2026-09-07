# Knowledge Context in Obsidian

This document defines how agents in this repository should read from and
write to the CarShop personal knowledge base maintained in Obsidian.

## Nature of the integration

- Obsidian is **not** accessed via a proprietary API. The vault is made up
  of local Markdown files — the integration is done by reading those files
  directly from the file system, or from a folder synced with the
  workspace, when available in the environment.
- If no vault or synced folder is available in the current environment, the
  agent must explicitly warn the user and proceed without consulting
  Obsidian, instead of assuming or inventing vault content.

## Vault structure

Within the personal vault, CarShop knowledge must be isolated in a
dedicated folder, with the following subfolder convention:

- `CarShop/Architecture` — current architecture decisions and diagrams.
- `CarShop/ADRs` — Architecture Decision Records (one decision per file,
  with context, alternatives considered, and consequences).
- `CarShop/Studies` — study notes, library comparisons, POCs, and learnings
  that have not yet become a decision.
- `CarShop/Decisions` — product/process decisions that are not strictly
  architectural (e.g., branch conventions, review flow).

## Source precedence

When reconciling conflicting information between sources, agents must
follow this order (from most to least authoritative):

1. **Current code** in the repository — the source of truth for what is
   actually implemented.
2. **Approved architecture decisions** (`CarShop/Architecture`,
   `CarShop/ADRs` in Obsidian).
3. **Current task in Notion** (Task Tracker) — see
   [docs/context/notion.md](./notion.md).
4. **Obsidian study notes** (`CarShop/Studies`) — exploratory material,
   non-binding until it becomes an ADR or a decision.

In other words: Obsidian complements Notion and the repository, but never
replaces them — study notes in particular are the least authoritative
source and must not guide implementation on their own.

## Reading rules

- Reading the vault is optional and should only happen when the task at
  hand clearly benefits from historical/architectural context (e.g., a
  question about a decision already made, an ADR relevant to the area being
  touched).
- Never duplicate vault content in repository files (`AGENTS.md`, `docs/`,
  etc.) — only reference the note's path/name when relevant, as is already
  done for Notion.

## Writing rules

- **Automatic writing (explicit and permanent user instruction):** whenever
  a CarShop task is completed/approved (the `reviewer` approves it with no
  blocking points), the `knowledge-manager` automatically records a note in
  the vault, without needing to ask for confirmation each time. Choose the
  subfolder based on the type of content:
  - `CarShop/ADR` — when the task involved a real architectural decision
    (framework/library swap, structural change, relevant trade-off). Follow
    the existing format (`ADR-XXX-short-title.md`: Status, Context,
    Decision, Alternatives Considered, Trade-offs, Consequences, Related
    Tasks, Related Code). Check the next available number before creating
    one.
  - `CarShop/Learnings` — a general learning that is not a standalone
    architectural decision (e.g., a coverage gap, a lesson about the
    process).
  - `CarShop/Troubleshooting` — a concrete problem found and resolved
    during the task (symptom, root cause, fix).
  - `CarShop/Patterns` — a reusable code pattern that emerged from the
    task.
  - `CarShop/Architecture` — an update to an already-existing architecture
    document (not a new one-off decision).
  Not every task requires a note in every subfolder — write only what is
  genuinely relevant; a TRIVIAL task may not generate any note.
- Outside this exception, agents must not write to or edit vault files as
  an unrequested side effect (e.g., mid-implementation, before the
  `reviewer`'s approval).
- **Never store secrets, tokens, passwords, or `.env` content** in the
  vault, in any note.
- Local vault paths (or a folder synced within this repository) must be
  added to `.gitignore` whenever they exist in this working directory, to
  avoid accidentally committing personal/private content.

## Quick summary (agent checklist)

- [ ] Confirmed whether a vault/synced folder is available in the
      environment before attempting to read or write
- [ ] Precedence respected: code > approved decisions > Notion task >
      Obsidian study notes
- [ ] At the end of a task approved by the `reviewer`, a note automatically
      recorded in the correct vault subfolder (ADR/Learnings/
      Troubleshooting/Patterns/Architecture), when genuinely relevant
- [ ] No secrets, tokens, passwords, or `.env` content referenced or copied
      into the vault
- [ ] Local vault paths in `.gitignore`, when applicable
