# Agent Context Synchronization

This document describes where agents working in this repository should get
context from before starting a task, and how to keep that context
consistent between the repository and external planning tools.

## Context sources

- **This repository's code and history**: architecture, conventions, and
  current implementation state. Source of truth for code.
- **Notion (CarShop / Task Tracker)**: Sprint, priority, description, DoD,
  and technical notes for each task. Source of truth for planning. See
  [notion.md](./notion.md) for the full lookup flow and writing rules.

## General rule

Before implementing any task, the agent must identify the current task and
consult the Task Tracker in Notion as described in [notion.md](./notion.md).
Do not implement based solely on assumptions about scope/DoD when that
information is available in Notion.

Changes to Notion (scope, technical notes, status) strictly follow the
writing rules described in [notion.md](./notion.md): never automatic, never
to mark `Done` without user validation, never to create unrequested tasks.
