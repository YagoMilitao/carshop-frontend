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

## Admin SSR session flow (CARSHOP-152 fix)

The backend (`GET /auth/session`) only accepts
`Authorization: Bearer <accessToken>` — it never accepts the session cookie.
The `access_token` only ever exists in browser memory (never persisted as a
cookie), so a Server Component has no way to send it on its own.

To solve this without inventing a new backend contract, the access token is
minted **before render**, in `proxy.ts` (the only layer of the Next pipeline
that runs before the render and can legitimately set response
`Set-Cookie` headers — a regular Server Component cannot):

1. `proxy.ts` (camada 1, `/admin/*` except `/admin/login`) reads the
   HttpOnly `refresh_token` cookie from the incoming request. If absent, it
   redirects to `/admin/login` without calling the backend.
2. If present, it calls `POST /auth/refresh` (forwarding the `Cookie`
   header and `X-CSRF-Token` when a `csrf_token` cookie exists), minting a
   fresh `accessToken`.
3. On success, it forwards the backend's rotated `Set-Cookie` headers
   (`refresh_token`/`csrf_token`) back to the browser via
   `response.headers.append("set-cookie", ...)`, and injects the minted
   `accessToken` into an **internal-only** request header
   (`x-carshop-access-token`) using `NextResponse.next({ request: { headers } })`.
   This internal header is never present on the actual response sent to the
   browser.
4. On failure (no refresh token, `/auth/refresh` returns non-ok, or a
   network error), it redirects to `/admin/login`, clearing
   `refresh_token`/`csrf_token` when applicable.
5. `lib/api/auth.server.ts#getSession()` (camada 2,
   `app/(admin)/admin/(protected)/layout.tsx`) no longer calls
   `/auth/refresh` itself. It only reads the `x-carshop-access-token`
   header (via `next/headers#headers()`) and, when present, calls
   `GET /auth/session` with `Authorization: Bearer <accessToken>`. It
   returns `null` on a missing header, a non-ok response, or a network
   error — the caller treats `null` as "not authenticated" and redirects to
   `/admin/login`.

Because response `Set-Cookie` headers can only be set from `proxy.ts`,
`refresh_token`/`csrf_token` rotation must stay there; do not attempt to
rotate cookies from a Server Component or Route Handler downstream of the
render.
