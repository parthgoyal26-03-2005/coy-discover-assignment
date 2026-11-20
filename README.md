# Coy Discover

A standalone implementation of **Part B of Coy's SDE Intern assignment**: a Discover tab with 36 fictional adult profiles, like/pass gestures, persistent decisions, and mutual matches. Home is the required placeholder.

**[Live demo](https://coy-discover-assignment.vercel.app/discover)** | **[GitHub source](https://github.com/parthgoyal26-03-2005/coy-discover-assignment)** | **[CI results](https://github.com/parthgoyal26-03-2005/coy-discover-assignment/actions)**

Start with [local installation](#local-installation), [API architecture](docs/API_ARCHITECTURE.md), [database relationships](docs/DATABASE.md), or the [beginner walkthrough](PROJECT_WALKTHROUGH.md). This is an independent recruitment demonstration, not Coy's official application or codebase.

## Screenshots

Actual screenshots of the approved interface, captured with Playwright from a production build. The readability cleanup preserves this design, animations, portraits, and branding.

| Discover: desktop | Discover: mobile |
| --- | --- |
| ![Desktop Discover](docs/screenshots/discover-desktop.png) | ![Mobile Discover](docs/screenshots/discover-mobile.png) |

| Mutual match celebration | Matches |
| --- | --- |
| ![Match celebration](docs/screenshots/match-mobile.png) | ![Matches](docs/screenshots/matches-desktop.png) |

## Features

- Touch and mouse swipes, Like/Pass buttons, and keyboard arrows; short drags return to rest.
- Public profile biographies, interests, expandable details, and 36 local illustrated portraits.
- Server-confirmed match celebration and a Matches screen with profile details.
- PostgreSQL persistence across reloads, with session-isolated progress and reset.
- Private incoming likes; only mutual interest produces a visible connection.
- Loading, empty, error, and retry states; accessible dialogs and reduced motion support.

## Stack

| Technology | Responsibility |
| --- | --- |
| Next.js App Router, React, TypeScript | UI pages and Node.js route handlers in one application |
| CSS tokens, Tailwind CSS 4, Bricolage Grotesque | Approved responsive interface and locally bundled typography |
| Motion, Lucide, Radix Dialog | Gestures, icons, accessible focus and dialogs |
| PostgreSQL hosted on Neon | Durable sessions, swipes, and matches; transactions and constraints |
| Drizzle ORM, node-postgres | Typed SQL queries and a shared connection pool |
| Zod | Runtime request validation |
| Vitest, Playwright, GitHub Actions | Unit, real-database integration, browser, and CI checks |
| Vercel | Existing production hosting with Node.js 24 |

## Architecture

```mermaid
flowchart LR
    A[React Discover and Matches] --> B[Same-origin JSON API]
    B --> C[Validate request and cookie session]
    C --> D[Matching service]
    D --> E[Drizzle / node-postgres]
    E --> F[(PostgreSQL)]
    F --> G[Public profiles and verified mutual matches]
    G --> A
```

The browser helper is [src/lib/api.ts](src/lib/api.ts). Routes resolve identity in [session.ts](src/lib/session/session.ts), call [service.ts](src/lib/matching/service.ts), and use [http.ts](src/lib/http.ts) for uncached JSON and safe errors. SQL and matching decisions stay on the server. [The API guide](docs/API_ARCHITECTURE.md) traces each request to its component, route, service, tables, and response.

## API summary

| Endpoint | Handler | Result |
| --- | --- | --- |
| `GET /feed` | [feed/route.ts](src/app/feed/route.ts) | Unswiped public profiles in stable order |
| `POST /swipe` | [swipe/route.ts](src/app/swipe/route.ts) | Saves `{ profileId, direction: "like" or "pass" }`; reports a newly created match |
| `GET /matches` | [matches/route.ts](src/app/matches/route.ts) | Current session's verified mutual matches |
| `POST /api/demo/reset` | [api/demo/reset/route.ts](src/app/api/demo/reset/route.ts) | Clears only current-session swipes and matches |

Sessions come from the HTTP-only `coy_session` cookie, never a request-body session ID. Handled errors use `{ "error": "message" }` with 400, 403, 404, 409, or 503 as appropriate. Reset ignores its body; swipe validates a strict JSON schema. See [complete requests, responses, validation, and flow diagrams](docs/API_ARCHITECTURE.md).

## Matching and privacy

A new outgoing **like** plus an existing private incoming like for the **same session/profile** creates a match. A pass and a one-sided like never do. The first profile, Aarohi, demonstrates a reciprocal like; Kabir demonstrates a one-sided like; passing Meera demonstrates that an incoming like alone is insufficient.

Swipes and reset lock the same session row inside transactions. Unique indexes prevent duplicate decisions and matches. An identical retry succeeds with `isMatch: false`, avoiding another celebration; a conflicting action returns 409. Public responses explicitly select displayable fields, and match queries recheck both sides. No incoming-like flag, count, or roster is exposed. [Read the algorithm and pseudocode](docs/MATCHING_LOGIC.md).

## Database summary

| Table | Stores |
| --- | --- |
| `profiles` | Fictional profile fields, local image path, stable order |
| `demo_sessions` | Random anonymous browser identity |
| `swipes` | Session-to-profile outgoing like or pass; unique pair |
| `incoming_likes` | Private simulated profile-to-session likes; composite primary key |
| `matches` | Confirmed session-to-profile connection; unique pair |

All interaction records reference a session and profile. Session deletion cascades to its interactions; the reset endpoint retains the session and incoming fixtures for replay. `coy_migrations` separately tracks applied SQL. See [columns, constraints, relationships, and ER diagram](docs/DATABASE.md).

## Local installation

Use **Node.js 24 LTS** (CI and Vercel use 24.x) and npm. Install dependencies, then copy the placeholder environment file:

```sh
npm ci
cp .env.example .env.local
```

PowerShell: `Copy-Item .env.example .env.local`.

Choose one PostgreSQL option:

- **Neon:** create your own database and replace `DATABASE_URL` in `.env.local` with its pooled connection URL, retaining Neon's TLS parameters.
- **Local without Docker:** run `npm run db:local` and leave that terminal open. It starts real PostgreSQL on `127.0.0.1:54329`, persisting under ignored `.postgres/`.
- **Docker:** run `docker compose up -d` for PostgreSQL on the same port. Run only one local option at a time.

For either bundled local option, set this disposable development URL in `.env.local`:

```dotenv
DATABASE_URL=postgresql://coy:coy_local_only@127.0.0.1:54329/coy
```

Those are local development defaults, not hosted credentials. For Neon, the placeholder shape is:

```dotenv
DATABASE_URL=postgresql://USER:PASSWORD@YOUR-NEON-HOST/DATABASE?sslmode=require
```

Then apply the existing migration and seed the selected development database:

```sh
npm run db:migrate
npm run db:seed
npm run dev
```

Open http://localhost:3000; `/` redirects to `/discover`. Migration is tracked and transaction-protected; seeding upserts the 36 stable profile IDs. Neither runs automatically during a build or deployment. This cleanup requires no new migration.

Keep `.env.local` private and never prefix `DATABASE_URL` with `NEXT_PUBLIC_`. Missing database configuration produces a generic 503 and a UI retry option; there is no in-memory persistence fallback. Bundled PostgreSQL needs its platform package's installation script; on Linux run it as a normal user, or use Docker/Neon instead.

## Testing

**Use a separate test database.** Tests create sessions, exercise reset, and delete their own fixtures. Do not use the deployed database. Set `DATABASE_URL` in the terminal to the test URL before migration, seeding, and all test/server commands; it takes precedence over `.env.local`.

```sh
export DATABASE_URL=postgresql://USER:PASSWORD@TEST-HOST/TEST-DATABASE
# PowerShell: $env:DATABASE_URL = 'postgresql://USER:PASSWORD@TEST-HOST/TEST-DATABASE'
npm run db:migrate
npm run db:seed
npm run lint
npm run typecheck
npm test
npx playwright install chromium
npm run build
npm run test:e2e
```

Vitest uses a real PostgreSQL database for matching, concurrency, constraints, reset, and isolation, plus focused client/error-boundary unit tests. Playwright starts a production server on port 3100 and runs desktop Chromium and touch-enabled mobile Chromium. Use `PLAYWRIGHT_CHANNEL=msedge` to select an installed Edge browser. Ensure another server with a different database is not already running on that port, because local Playwright configuration can reuse an existing server.

Browser tests cover gestures, buttons, keyboard, privacy, validation, cookie replacement, reload persistence, reset, error recovery, and all portrait URLs. Screenshots are written to `docs/screenshots/`. See [actual verification results](VALIDATION.md). `npm start` serves a completed production build outside the test runner.

## Documentation

- [API architecture](docs/API_ARCHITECTURE.md): request flows, exact file locations, JSON, errors.
- [Database guide](docs/DATABASE.md): all columns, relationships, constraints, reset and persistence.
- [Matching logic](docs/MATCHING_LOGIC.md): concrete examples, locking, retries, privacy, pseudocode.
- [Project walkthrough](PROJECT_WALKTHROUGH.md): junior-friendly explanations and a two-minute interview introduction.
- [Validation record](VALIDATION.md): checks actually executed and review findings.
- [Historical redesign evidence](docs/redesign/README.md): earlier before/after comparisons; current screenshots are above.
- [Official brand asset sources](public/brand/README.md) and [portrait attribution](public/demo-profiles/ATTRIBUTION.md).

## Deployment

The existing [production URL](https://coy-discover-assignment.vercel.app/discover), Vercel project, Node.js 24 configuration, and Neon database are retained. Vercel now reports the existing project as Git-linked to `parthgoyal26-03-2005/coy-discover-assignment`. Pushes to `main` trigger the production deployment; GitHub Actions separately runs the verification workflow and does not itself deploy.

The earlier publication used Vercel's Git-source deployment API before the Git connection was configured. The final review checks the automatic deployment's commit against GitHub `main` and verifies the existing public URL. Preserve the project's environment variables and database when updating it; builds do not migrate or seed production. Exact final workflow/deployment status is reported in the delivery summary.

## Scope and limitations

This independent assignment uses its own backend and fictional adults. It does not call Coy's production APIs. Official local logo/icon assets identify the assignment's brand; they do not imply endorsement. All fonts and portraits are local.

Incoming likes are simulated fixtures, not real two-user actions. Cookies provide anonymous isolation rather than authentication or account recovery. There is no OTP, invitation system, payment, chat, moderation, or preference filtering. Sessions do not yet have an automatic database-retention process. A real public product would need identity, consent, abuse controls, rate limiting, and operational monitoring. Those are outside Part B and are not added by this cleanup.
