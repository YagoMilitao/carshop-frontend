# Rule: Branch Naming

- Mandatory pattern: `<type>/<task-id>-<short-description>`
  (`<type>/CARSHOP-<numero>-<short-description>`). A task ID must be
  identified before creating the branch — per `AGENTS.md`, agents must
  identify the current `CARSHOP-XX` task (or ask the user) before
  implementing, and that identification happens before the branch is
  created, not after.
- The `<type>[-<short-description>]` pattern (no task ID) is not a default
  fallback for "couldn't find a task ID." It is reserved for work the user
  has **explicitly confirmed** has no corresponding Notion task (e.g. a
  one-off local housekeeping change with no tracked task). An agent must
  never silently create a task-less branch just because it failed to
  resolve a `CARSHOP-XX` ID — it must ask the user first, per `AGENTS.md`.
- `<short-description>` is short, objective, written in English, and in
  kebab-case. It is required whenever a task ID exists.
- Every working branch tied to a task references the corresponding Notion
  task ID (`CARSHOP-XX`).

## Official prefixes

`<type>` must be one of the following official prefixes. Choose it based on
the **real nature of the change being made in the code**, not by
automatically copying the `Type` field from the Notion task. If a change has
multiple natures, use the prefix that matches the **main goal of the
branch**.

- `feat`: introduces a new feature or capability.
- `fix`: fixes a bug or incorrect behavior.
- `refactor`: restructures existing code without changing external behavior.
- `chore`: maintenance work with no production code change and **no
  dependency version change** (e.g. repo housekeeping, non-dependency
  config/tooling files, editor/IDE config). Once a dependency version is
  bumped (`package.json`/lockfile), use `build` instead — see the `build`
  entry below for the exact boundary.
- `docs`: documentation-only changes.
- `test`: adds or updates tests only.
- `perf`: improves performance without changing external behavior.
- `ci`: changes to CI/CD pipelines or automation configuration.
- `build`: changes to the build system/build config, **or any change to a
  dependency's version** (`package.json`/lockfile), production or dev —
  e.g. bumping `next`, bumping `eslint`, `npm audit fix`. This is the only
  prefix for dependency version bumps; `chore` never applies to them.
- `style`: formatting-only changes (no logic change) such as linting,
  whitespace, or code style fixes.
- `revert`: reverts a previous change/commit.

**Never use `feature/` or `bugfix/` as prefixes.** The official prefixes for
those cases are `feat` and `fix`, respectively.

## Not to be confused with Conventional Commits

This branch naming rule is independent from the Conventional Commits
convention used for commit messages. A branch prefix and the prefixes used
in individual commit messages inside that branch do not need to match one
commit-for-commit — the branch prefix reflects the branch's main goal, while
each commit message reflects the nature of that specific commit.

## Communicating the suggested branch to the user

When an agent suggests or creates a branch, it must present the suggestion
to the user **in pt-BR**, including:

1. The suggested branch name.
2. A short justification (in pt-BR) for the chosen prefix, explaining why it
   reflects the real nature of the change (not simply the Notion task
   `Type`).

Internal instructions in this file remain in en-US, per the agents' language
policy; only the user-facing communication of the suggested branch name and
justification must be in pt-BR.

## Examples

- `feat/CARSHOP-123-admin-login`
- `fix/CARSHOP-124-refresh-token-cookie`
- `refactor/CARSHOP-125-auth-service`
- `chore/CARSHOP-126-cleanup-unused-scripts`
- `docs/CARSHOP-127-update-readme`
- `test/CARSHOP-128-auth-service-tests`
- `perf/CARSHOP-129-optimize-work-images`
- `ci/CARSHOP-130-sonar-pipeline`
- `build/CARSHOP-131-next-build-config`
- `style/CARSHOP-132-format-agent-files`
- `revert/CARSHOP-133-revert-auth-change`
