# Rule: Branch Naming

- Mandatory pattern: `<type>/<task-id>-<short-description>` when a task ID
  exists (`CARSHOP-<numero>`), e.g. `<type>/CARSHOP-<numero>-<short-description>`.
  If there is no task ID, the pattern falls back to `<type>[-<short-description>]`.
- `<short-description>` is short, objective, written in English, and in
  kebab-case. It should be recommended/required for readability whenever a
  task ID exists.
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
- `chore`: maintenance work with no production code change (e.g. dependency
  bumps, tooling housekeeping).
- `docs`: documentation-only changes.
- `test`: adds or updates tests only.
- `perf`: improves performance without changing external behavior.
- `ci`: changes to CI/CD pipelines or automation configuration.
- `build`: changes to the build system or external dependencies/build config.
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
- `chore/CARSHOP-126-update-dependencies`
- `docs/CARSHOP-127-update-readme`
- `test/CARSHOP-128-auth-service-tests`
- `perf/CARSHOP-129-optimize-work-images`
- `ci/CARSHOP-130-sonar-pipeline`
- `build/CARSHOP-131-next-build-config`
- `style/CARSHOP-132-format-agent-files`
- `revert/CARSHOP-133-revert-auth-change`
