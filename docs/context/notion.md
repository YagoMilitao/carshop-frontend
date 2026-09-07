# Planning Context in Notion

This document defines how agents in this repository should consult Notion
before implementing any CarShop Frontend task.

## Source of truth

- **Notion → CarShop → Task Tracker** is the source of truth for planning:
  Sprint, priority, description, Definition of Done (DoD), and technical
  notes.
- **This repository** is the source of truth for code.
- Never duplicate Task Tracker content in repository files (AGENTS.md,
  README, etc.). Repo files only keep references and lookup rules — the
  live content stays in Notion.

## Location in Notion

- Project root page: `CarShop` (in Yago Militão's workspace, under
  `Projects / CarShop`).
- Task database: `CarShop / Task Tracker`.
- Each task is an item (row) in that database, identified by its title
  (`Task`) and by an incremental ID (`ID`).

## Mandatory flow before implementing

1. **Identify the current task.** Before writing any code, the agent must
   know which Task Tracker item is being worked on. Identification can come
   from:
   - the `CARSHOP-XX` number/branch given by the user (branch convention:
     `feat/CARSHOP-XX-short-description`, `fix/CARSHOP-XX-short-description`,
     etc.);
   - the task title mentioned by the user; or
   - asking the user directly when the task cannot be inferred.

   If the task cannot be identified with confidence, the agent must ask the
   user instead of assuming or inventing a task.

2. **Consult the Task Tracker in Notion** (via the Notion connector, when
   available in the environment) and read, at minimum, the following
   properties of the corresponding item:
   - `Task` (title)
   - `Description` (Notion property: `Descrição`)
   - `DoD (Definition of Done)`
   - `Technical Notes` (Notion property: `Notas Técnicas`)
   - `Stack`
   - `Sprint`
   - `Priority`
   - `Component`
   - `Status` (to know the current state — Backlog, To Do, In Progress,
     Review, Blocked, Cancel, Done)

3. **Use this information to guide implementation**: the `Description` and
   the `DoD` define the scope and acceptance criteria; `Technical Notes`
   brings constraints/decisions already made; `Stack`/`Component` help
   confirm that the task actually belongs to the frontend before
   implementing it here.

4. If the Notion connector is not available in the environment, the agent
   must explicitly warn the user and ask for the task's information
   manually (Description, DoD, Technical Notes) before proceeding, instead
   of assuming values.

## Notion writing rules

- The agent **must not change the Task Tracker automatically** as a side
  effect of an implementation, with the single explicit exception below
  (transition to `Review`).
- **Exception: automatic transition to `Review`.** When the `reviewer`
  completes the review of a task with an approval verdict (no blocking
  points), that task's status in the Task Tracker must be automatically
  updated to `Review`, without needing to ask the user every time. This
  reflects a permanent instruction from the user (it is not an automatic
  "task completed" decision — `Review` only signals that the implementation
  is ready for human review/merge, not that the task is finished).
- Scope changes (a new technical note, a description adjustment, a change
  to Sprint/Priority/Component, etc.) should only be reflected in Notion
  when:
  - the user explicitly asks for it; or
  - it is necessary to keep the task consistent with what was actually
    implemented (e.g., the scope changed during implementation and Notion
    would become outdated/misleading if not adjusted) — and even in this
    case, the agent must confirm with the user before writing to Notion.
- **Never mark a task as `Done`** without explicit validation of the
  implementation by the user. The agent does not decide on its own that a
  task is complete — `Done` remains outside the exception above and always
  requires explicit confirmation.
- **Never invent tasks** in the Task Tracker. A new task is only created at
  the user's explicit request.

## Quick summary (agent checklist)

- [ ] Current task identified (ID/branch/title confirmed with the user if
      necessary)
- [ ] Task Tracker consulted in Notion for this task
- [ ] Description, DoD, Technical Notes, Stack, Sprint, Priority, and
      Component read
- [ ] Implementation aligned with the DoD before considering the task
      complete
- [ ] No writes to Notion without an explicit request or a need for
      consistency confirmed with the user
