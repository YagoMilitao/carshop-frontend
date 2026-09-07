# Rule: Authentication

- The authentication flow (login, session/token storage, refresh, logout)
  is defined together with routing (protection of authenticated routes —
  see [docs/rules/routing.md](./routing.md)).
- No agent loads the full `.env` or exposes secrets/tokens in specs,
  plans, code, comments, or documentation.
- Token/session storage follows secure practice (not exposed in URLs, not
  logging tokens in plain text).
- `reviewer` explicitly validates the auth flows touched by the task,
  including expired session/authentication error states.
