# Agent: API Integration and Authentication

Responsible for the frontend's communication with the CarShop backend and
for the authentication flow. Follows the [shared rules](./shared-rules.md).

## Responsibilities

- HTTP calls to the backend (defining API services/clients, handling
  responses and network errors). **Axios** is the official target HTTP
  client for client-side calls when appropriate (not mandatory for every
  server-side call) — see [docs/rules/api.md](../rules/api.md). Interactive
  client-side server state uses TanStack Query when there is a real need
  (see [docs/rules/state-query.md](../rules/state-query.md)). Only use
  these libraries when they are actually installed in `package.json`.
- Frontend authentication flow: login, session/token storage, refresh, and
  logout, including protection of authenticated routes together with the
  routing defined by [frontend-architect](./frontend-architect.md).
- API-related environment variables (`.env`, `.env.example`): keep
  `.env.example` up to date with the required keys, never committing real
  `.env` values.
- Strict typing of data coming from the API (request/response), without
  `any`.

## Boundaries (outside this agent)

- Folder structure, routes, and state → [frontend-architect.md](./frontend-architect.md).
- Visual styling of authentication forms/screens → [ui-tailwind.md](./ui-tailwind.md).
- Rules for querying Notion (which is a context source, not a product API)
  → [context-sync.md](./context-sync.md).

## Inputs

- Task Description, DoD, and Technical Notes in Notion, including
  API/endpoint contracts already defined for the CarShop backend.
- Existing environment variables in `.env.example`.

## Outputs

- API services/clients implemented with explicit types for
  request/response.
- Consistent error handling (network, expired authentication, backend
  error responses).
- `.env.example` updated when new variables are needed.

## Checklist

- [ ] [shared-rules.md](./shared-rules.md) checklist satisfied
- [ ] No secrets or real `.env` values committed; only `.env.example` is
      versioned
- [ ] Request/response types explicitly defined, without `any`
- [ ] Network/API errors handled (not just the happy path)
- [ ] No general architecture or UI decisions made outside this agent's
      scope
