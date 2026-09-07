# Rule: Testing

- `tester` uses the testing stack officially configured in `package.json`
  — check what is actually installed before writing tests.
- If no testing stack is installed, this is a blocker/dependency to flag to
  the user, not a reason to invent a framework or fake test results.
- Goal: ≥80% coverage on new/changed code, when applicable (e.g., when the
  testing stack and coverage metric are configured).
- Tests cover the task's DoD, including relevant error paths (not just the
  happy path).
- Tests must pass before the task is considered ready for review.
