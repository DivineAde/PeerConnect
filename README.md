# PeerConnect

A small, polished professional networking application — built for the Abbey FullStack Engineer Challenge.

PeerConnect lets people create an account, maintain a profile, discover other
members, and build a network of professional connections (send, accept,
decline, and remove connection requests). The focus of this build is not
feature count — it's demonstrating a clean, secure, well-structured
full-stack application with a genuinely polished frontend.

---

## Overview

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, React Hook Form + Zod, next-themes, Sonner.
- **Backend:** Node.js, Express, TypeScript, layered Route → Controller → Service → Prisma.
- **Database:** PostgreSQL via Prisma.
- **Auth:** Email/password with bcrypt, JWT access tokens + rotating opaque refresh tokens in HTTP-only cookies, and optional Google OAuth.
- **Monorepo:** pnpm workspaces, with small shared packages for the database client, validation schemas, and DTO types.

Demo login (after seeding): `divine.okafor@peerconnect.dev` / `Passw0rd!`

---

## Architecture

```
Browser
   │  fetch(credentials: "include")
   ▼
Next.js (apps/web)            — App Router, client components, talks directly to the API
   │  HTTPS, cross-domain
   ▼
Express API (apps/api)        — Route → Controller → Service → Prisma
   │
   ▼
Prisma (packages/database)
   │
   ▼
PostgreSQL
```

The frontend and backend are **separate applications on separate domains**
in production (e.g. `app.example.com` and `api.example.com`). The frontend
never proxies through Next.js API routes — it talks to the Express API
directly, with every request sent using `credentials: "include"` so the
browser attaches the API's auth cookies.

### Monorepo layout

```
apps/
  web/        Next.js app (App Router)
  api/        Express API
packages/
  database/   Prisma client singleton + schema access
  validation/ Shared Zod schemas (used by both API request validation
              and frontend react-hook-form resolvers, so the rules can
              never drift between client and server)
  types/      Shared response DTO shapes
prisma/
  schema.prisma
  seed.ts
```

Every package has one clear job. There's no `packages/utils` grab-bag and no
package created just to look thorough.

---

## Authentication

- **Registration / login** — email + password, hashed with bcrypt (12 rounds). Google OAuth is optional and additive; password login always works even if OAuth isn't configured.
- **Access token** — short-lived (15 min) JWT, stored in an HTTP-only cookie. Verified on every protected request by `requireAuth` middleware.
- **Refresh token** — a long-lived (30 day), opaque, cryptographically random value. Only its SHA-256 hash is stored in Postgres, so a leaked database doesn't itself grant usable sessions. Also stored in an HTTP-only cookie, never exposed to frontend JavaScript.
- **Rotation & reuse detection** — every call to `/api/auth/refresh` issues a brand-new refresh token and immediately revokes the one just used. If a *already-revoked* token is ever presented again (a strong signal it was stolen and used twice), the entire token "family" from that login is revoked, forcing re-authentication.
- **Session restoration** — on page load, the frontend calls `GET /api/auth/me`. If the access token has expired, the API client transparently calls `/api/auth/refresh` once and retries the original request, so a refreshed browser tab doesn't show a flash of "logged out."
- **Single-flight refresh** — if several requests 401 at the same moment, they share one in-flight refresh call instead of racing (and invalidating) each other.
- **Logout** — revokes the current refresh token server-side and clears both cookies.

### Cross-domain cookies

Because the frontend and API live on different domains, cookies are set with
`SameSite=None; Secure` in production (required for the browser to send them
on cross-site requests at all) and `SameSite=Lax` in local development
(`http://localhost` doesn't support `SameSite=None` without HTTPS). CORS on
the API is locked to the configured `WEB_URL` (plus any `CORS_EXTRA_ORIGINS`)
with `credentials: true`.

### Why there's no auth middleware in Next.js

Next.js middleware runs on the frontend's own server. Since the API's auth
cookies belong to the **API's domain**, not the frontend's, that middleware
would never actually see them in a genuinely cross-domain deployment — it
would always look "logged out" even for a signed-in user. Route protection
is therefore handled client-side, in `app/(app)/layout.tsx`, based on the
result of `GET /api/auth/me`. This is a deliberate trade-off, not an
oversight — see "Trade-offs" below.

### Google OAuth flow

```
"Continue with Google" → GET /api/auth/google → Google consent screen
  → GET /api/auth/google/callback → find-or-create user (linking by email
  if a password account already exists) → issue token pair → redirect to
  the frontend's /dashboard
```

If `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`/`GOOGLE_CALLBACK_URL` aren't
set, the routes still exist but redirect back to `/login` with a clear
message instead of 404ing or crashing the server.

---

## Database

Three models, on purpose:

- **User** — profile + credentials. `provider` distinguishes password vs Google accounts; `googleId` is unique and nullable.
- **RefreshToken** — one row per issued refresh token, with `familyId` (all tokens from one login share a family, for reuse-detection), `replacedBy`/`revokedAt` for rotation bookkeeping, and `expiresAt`.
- **Connection** — one row per pair of users, see below.

### Connection design decision

A connection needs to know **who requested it** (to render "Pending" vs
"Accept/Decline" correctly) but the app must never allow two rows to
represent the same relationship — neither a duplicate `A → B` request, nor a
mirrored `A → B` and `B → A` pair.

The schema stores `requesterId`/`receiverId` for that directional
information, plus a normalized, order-independent pair —
`userLowId`/`userHighId`, always sorted so `userLowId < userHighId` — with a
**single unique constraint** on that pair. This makes duplicate and mirrored
connections structurally impossible at the database level, not just
discouraged by application logic. Re-requesting after a decline reuses the
same row (updating it back to `PENDING`) rather than trying to insert a
second one, which the unique constraint wouldn't allow anyway.

---

## API

All responses share one envelope:

```json
{ "success": true, "data": { ... } }
{ "success": false, "error": { "code": "CONNECTION_ALREADY_EXISTS", "message": "…" } }
```

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | Create an account |
| POST | `/api/auth/login` | Log in |
| POST | `/api/auth/refresh` | Rotate refresh token, issue new access token |
| POST | `/api/auth/logout` | Revoke refresh token, clear cookies |
| GET | `/api/auth/me` | Current user |
| GET | `/api/auth/google` | Begin Google OAuth |
| GET | `/api/auth/google/callback` | Google OAuth callback |
| GET | `/api/users` | Discover users (`?q=`, `?cursor=`) |
| GET | `/api/users/:id` | Public profile + viewer relationship |
| GET | `/api/account` | Your account |
| PATCH | `/api/account` | Update your profile |
| GET | `/api/connections` | Your accepted connections |
| GET | `/api/connections/requests` | Pending incoming requests |
| GET | `/api/connections/sent` | Pending outgoing requests |
| GET | `/api/connections/summary` | Counts for the dashboard |
| POST | `/api/connections/:userId` | Send a connection request |
| PATCH | `/api/connections/:id` | `{ "action": "ACCEPT" \| "REJECT" }` |
| DELETE | `/api/connections/:id` | Remove a connection / cancel your own pending request |

All routes except `/api/auth/*` require a valid access-token cookie.

---

## Local setup

**Prerequisites:** Node.js 20+, pnpm 9+, Docker (for Postgres) or a local Postgres instance.

```bash
git clone <repo-url> abbey-fullstack-challenge
cd abbey-fullstack-challenge

pnpm install

cp .env.example .env
# then also copy the relevant values into apps/api/.env and
# apps/web/.env.local (see "Environment variables" below)

docker compose up -d          # starts Postgres on localhost:5432

pnpm db:migrate                # creates the schema
pnpm db:seed                   # seeds demo users + connections

pnpm dev                       # runs the API (4000) and web app (3000)
```

Then open `http://localhost:3000` and log in with the demo credentials above.

### Scripts

```
pnpm dev          # run web + api together
pnpm dev:web       pnpm dev:api
pnpm build        # build all packages, api, and web
pnpm start        # run production builds
pnpm lint
pnpm typecheck
pnpm test         # runs the API's Vitest suite
pnpm db:migrate   pnpm db:seed   pnpm db:studio
```

---

## Environment variables

See `.env.example` at the repo root for the full list with inline
descriptions. In short:

- `DATABASE_URL` — used by Prisma and the API. **Never** sent to the browser.
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` — sign access tokens; refresh tokens themselves are random, not JWTs, but the secret naming is kept for clarity of intent. Generate with `openssl rand -base64 48`.
- `WEB_URL` / `API_URL` — used for CORS, cookie behavior, and OAuth redirects. No `localhost` is hard-coded anywhere in production code paths.
- `COOKIE_DOMAIN` — optional; only needed if frontend and API share an apex domain.
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_CALLBACK_URL` — optional. Password auth works fully without these.
- `NEXT_PUBLIC_API_URL` — the **only** variable exposed to the browser; everything else stays server-side.

---

## Testing

`pnpm test` runs the API's Vitest suite (`apps/api/src/tests`). Coverage
focuses on business rules rather than chasing a coverage percentage:

- **Auth:** duplicate-email rejection, password hashing, generic "invalid
  credentials" messaging for both unknown emails and wrong passwords.
- **Connections:** self-connection prevention, duplicate/already-connected
  rejection, authorization (only the receiver can accept/reject; only a
  connection's participants can remove it; a receiver can't silently delete
  an incoming request instead of responding to it).
- **Validation:** the shared Zod schemas reject weak passwords and invalid
  emails with the specific, actionable messages the UI relies on.

These tests mock the Prisma client rather than requiring a live database, so
they run anywhere without infrastructure. An integration suite against a
real Postgres instance (e.g. via `supertest` + a Docker Postgres in CI) would
be the natural next layer — the same service functions are already
structured to support that without changes.

---

## Deployment

```
Web:      Vercel
API:      Render / Railway (Docker or Node buildpack)
Database: Any managed Postgres (Render, Neon, Railway, RDS)
```

1. Provision Postgres, run `pnpm db:migrate` and `pnpm db:seed` against it (or omit seeding in real production).
2. Deploy `apps/api` with `DATABASE_URL`, `WEB_URL` (your deployed frontend URL), `JWT_*` secrets, and (optionally) the Google OAuth variables. Set `NODE_ENV=production`.
3. Deploy `apps/web` with `NEXT_PUBLIC_API_URL` pointing at the deployed API.
4. Confirm the full flow in production: register → login → refresh the page (still logged in) → let the access token expire and make a request (silently refreshes) → log out → protected routes now redirect to `/login`. Then test Google OAuth end-to-end if configured.

### Production build correctness

`apps/api`'s `package.json` points `main`/`start` at `dist/server.js`,
produced by `tsc -p tsconfig.json`, and nothing in the runtime path
references `ts-node`, `tsx`, or other dev-only tooling — `pnpm build` then
`pnpm start` from a clean checkout is the exact path a host like
Render/Railway will run. `apps/web` uses the standard `next build` /
`next start` pair with no custom output overrides.

---

## Architectural decisions

- **Client-side route protection**, not Next.js middleware — see "Why
  there's no auth middleware in Next.js" above.
- **Refresh tokens are opaque random values, hashed at rest** — not JWTs.
  The server is the only party that ever needs to interpret them, so there's
  no benefit to a self-describing token, and hashing means a database leak
  alone doesn't grant sessions.
- **Connections use a single normalized-pair unique constraint** rather than
  allowing two directional rows — see "Database" above. This was the single
  most important modeling decision in the schema.
- **A small, deliberately boring structured logger** instead of a full
  logging stack (pino/winston + transports) — `console` output in a
  consistent JSON shape is enough for an app this size and is trivial to
  swap later.
- **Zod schemas live in a shared package**, imported by both the API
  (server-side validation) and the web app (`@hookform/resolvers/zod`
  client-side validation), so the two can never drift apart.

## Trade-offs — what was intentionally not built

- **No refresh-token device/session management UI** ("log out of other
  devices"). The data model (`RefreshToken` rows per session) supports it,
  but it wasn't in scope for the challenge's relationship-focused brief.
- **No account deletion / GDPR export flows** — out of scope for a demo app.
- **No email verification** — registration is immediate. A real product
  would gate certain actions behind a verified email.
- **No infinite-scroll pagination in Discover** — the API supports
  cursor-based pagination (`?cursor=`), but the UI currently loads a single
  page; wiring up "load more" is a small, contained addition on top of the
  existing API contract.
- **No Redis, queues, websockets, or microservices** — nothing in this
  brief needed them, and adding them would be complexity for its own sake.
- **Integration tests against a real Postgres instance** were left as a
  natural next step rather than built now, in favor of fast, dependency-free
  unit tests around the actual business rules (see "Testing").
