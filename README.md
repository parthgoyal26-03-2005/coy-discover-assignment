# Coy Discover

**A little curiosity. A real connection.**

A standalone, mobile-first proposal for Coy's Discover tab, built for **Part B of the Coy SDE Intern assignment**. Browse 36 fictional adults, swipe left to pass or right to like, and discover a connection only when the feeling is mutual.

**[Open the live app](https://coy-discover-assignment.vercel.app)** · **[Public GitHub repository](https://github.com/parthgoyal26-03-2005/coy-discover-assignment)** · **[Passing verification workflow](https://github.com/parthgoyal26-03-2005/coy-discover-assignment/actions/runs/44551376852)**

The live app is deployed to Vercel on Node.js 24 and connected to Neon PostgreSQL. Its migration and all 36 seed profiles are applied. HTTPS browser verification confirmed mutual matching, reload persistence, touch dragging, session isolation, scoped reset, and zero browser console errors. The verified application source is commit `3367b31992b071b279ace675e8830198f44ee38d`; subsequent documentation commits record the live results.

This project uses its own data and backend. It never calls Coy's production APIs. Part A, OTP, invitations, payments, and chat are outside this submission.

## What works

- An intentionally blank Home placeholder and a working Discover tab.
- Touch and mouse dragging, spring-back below the swipe threshold, Like/Pass buttons, and arrow-key shortcuts.
- Profile biographies, interest tags, expandable information, and locally bundled illustrated portraits.
- A server-confirmed match celebration and a Matches screen with profile details.
- Persistent outgoing swipes and matches in PostgreSQL, restored after reload.
- Anonymous browser sessions isolated by an HTTP-only cookie.
- A reset action scoped to the current browser's session.
- Loading skeletons, empty and error states, failed-swipe recovery, reduced motion, and accessible dialogs.

## Screenshots

Real screenshots are captured by the Playwright walkthrough, with the app connected to local PostgreSQL.

| Discover · desktop | Discover · mobile |
| --- | --- |
| ![Desktop Discover](docs/screenshots/discover-desktop.png) | ![Mobile Discover](docs/screenshots/discover-mobile.png) |

| Mutual match | Matches |
| --- | --- |
| ![Match celebration](docs/screenshots/match-mobile.png) | ![Matches view](docs/screenshots/matches-desktop.png) |

## Stack

| Technology | Purpose |
| --- | --- |
| Next.js App Router + React | Pages, navigation, and server API handlers in one project |
| TypeScript, strict mode | Catch data-shape mistakes during development |
| Tailwind CSS 4 + CSS tokens | Shared color, spacing, layout, and responsive styling |
| Motion | Drag gestures, card rotation, and transitions |
| Lucide React | Consistent interface icons |
| PostgreSQL / Neon | Durable records, transactions, and unique constraints |
| Drizzle ORM + node-postgres | Typed queries and PostgreSQL connection pooling |
| Zod | Runtime validation of API requests |
| Radix Dialog | Focus trapping, focus restoration, and Escape dismissal |
| Vitest + Playwright | Database integration tests and real browser walkthroughs |
| Vercel | Deployment target; Node.js API runtime |

The heading font is Bricolage Grotesque; body text uses DM Sans. Both are bundled locally. The interface follows the supplied Coy reference: white surfaces, bright pink actions, lavender accents, rounded cards, dark outlines, and hard offset shadows.

## Start locally

Use **Node.js 22.13+ (or Node.js 24 LTS)** and npm. Git is needed for version control. A hosted Neon database, local PostgreSQL, or Docker can supply the database.

```sh
npm ci
```

Copy `.env.example` to `.env.local` (PowerShell: `Copy-Item .env.example .env.local`). Choose one database option:

### Option A: Neon, the deployment database

Create a Neon PostgreSQL project and put its pooled connection URL into `.env.local`:

```dotenv
DATABASE_URL=postgresql://USER:PASSWORD@YOUR-NEON-HOST/DATABASE?sslmode=require
```

Use the URL provided by Neon, including its TLS parameters. Keep it server-only: never prefix it with `NEXT_PUBLIC_`, paste it into source code, or commit `.env.local`. The app uses standard PostgreSQL queries, so the same migrations and tests work against Neon.

### Option B: local PostgreSQL without Docker

```sh
npm run db:local
```

Leave that terminal open. This starts a **real PostgreSQL server**, with data stored under ignored `.postgres/`. The default URL in `.env.example` points to it. Stop it with Ctrl+C; restarting preserves the database.

The `embedded-postgres` development dependency bundles PostgreSQL binaries. If your package manager blocks its installation script, approve/rebuild the platform package as described in the package's README. On Linux, run as a normal user rather than root. For machines where bundled binaries are unavailable, use Docker or an existing PostgreSQL installation.

### Option C: Docker

```sh
docker compose up -d
```

This supplies PostgreSQL on the same local port and URL as Option B. Run only one local option at a time. Docker must be running.

### Migrate, seed, run

In a second terminal:

```sh
npm run db:migrate
npm run db:seed
npm run dev
```

Open **http://localhost:3000**. `/` redirects to `/discover`.

Migrations are tracked in `coy_migrations`, applied inside a transaction, and serialized with a PostgreSQL advisory lock. Re-running migration is safe. Seeding upserts the same 36 profile IDs and preserves existing sessions and swipe history. Private incoming likes are initialized when a browser session is created.

If `DATABASE_URL` is absent, migration and seed scripts explain the missing setup. API requests return a helpful 503 response; the UI offers retry. There is no in-memory or localStorage persistence fallback.

## Try the demo

1. Browse the first profile and drag right or select Like. The backend confirms a mutual match and opens the celebration.
2. Select **View Matches**, open a matched profile, and reload. The match remains.
3. Return to Discover. The swiped profile stays out of the feed.
4. Like the second profile: a one-sided like does not create a match.
5. Pass the third profile: passing never creates a match.
6. Open Home to see the placeholder, or use the header reset control to replay your browser's demo.

For repeatable review, the first profile is a reciprocal-like fixture. This is documented for interview demonstration; no API or UI exposes incoming-like flags, counts, or lists. All fixture logic stays on the server.

## Architecture

```mermaid
flowchart LR
    A[React Discover and Matches] -->|HTTP-only session cookie| B[Next.js route handlers]
    B --> C[Zod request validation]
    C --> D[Matching service]
    D --> E[Drizzle ORM]
    E --> F[(PostgreSQL / Neon)]
    F -->|Public profile fields and mutual matches| A
```

### Tables

| Table | Purpose and constraints |
| --- | --- |
| `profiles` | 36 adults, biography, location, interests, local portrait URL, stable feed order |
| `demo_sessions` | Random session UUID and creation time |
| `swipes` | Session → profile, action `like` or `pass`; unique `(session_id, profile_id)` |
| `incoming_likes` | Private simulated profile → session likes; composite primary key |
| `matches` | Session ↔ profile mutual connection; unique `(session_id, profile_id)` |

Session-owned records reference `demo_sessions`; profile references point to `profiles`. Deleting a session cascades to its interactions. Reset instead deletes only that session's matches and outgoing swipes, preserving the private fixtures for replay.

### Browser sessions

The server checks a random UUID in the `coy_session` cookie against PostgreSQL. An unknown or absent ID creates a fresh server-owned session. The cookie is HTTP-only, SameSite=Lax, has a one-year lifetime, and uses Secure in production. Browsers cannot choose a different session through a request body. Cookies and records survive reloads and deployments when the same database and domain are retained. Clearing cookies creates a new demo identity.

### Matching and privacy

The rule is deliberately simple: **outgoing LIKE + private incoming LIKE = match**. A pass or a one-sided like never matches.

The matching service locks the session row in a database transaction before reading or changing interaction state. The swipe and any new match commit together. Reset obtains the same lock. Unique indexes provide an additional database-level guarantee against duplicates.

An identical retried swipe returns success with `isMatch: false`; it does not celebrate a match twice. A contradictory retry returns 409. Feed queries exclude every existing swipe, including passes, and never join incoming likes. Public responses explicitly select displayable fields. Matches are joined against both the outgoing like and incoming like before being returned.

Mutation routes reject cross-site Origins and cross-site Fetch Metadata. Session cookies are never returned in JSON. Personalized endpoints use `Cache-Control: private, no-store`.

## API

All responses are JSON. Cookie sessions are created automatically. Examples omit the full profile biography and tags for brevity.

### `GET /feed`

Returns all unswiped profiles in stable fixture order:

```json
{"profiles":[{"id":"00000000-0000-4000-8000-000000000001","name":"Aarohi","age":23,"city":"Delhi","bio":"…","interests":["Photography","Bookstores","Coffee"],"photoUrl":"/demo-profiles/aarohi.svg"}]}
```

Returns `{"profiles":[]}` after the deck is exhausted. Never includes incoming-like status or internal seed fields.

### `POST /swipe`

```json
{"profileId":"00000000-0000-4000-8000-000000000001","direction":"like"}
```

`direction` accepts only `like` or `pass`. Extra fields are rejected. A non-match or idempotent retry returns:

```json
{"success":true,"isMatch":false}
```

A newly confirmed mutual match returns:

```json
{"success":true,"isMatch":true,"profile":{"id":"00000000-0000-4000-8000-000000000001","name":"Aarohi","age":23,"city":"Delhi","bio":"…","interests":["Photography","Bookstores","Coffee"],"photoUrl":"/demo-profiles/aarohi.svg"}}
```

### `GET /matches`

```json
{"matches":[{"id":"MATCH-UUID","matchedAt":"2026-11-19T12:00:00.000Z","profile":{"id":"PROFILE-UUID","name":"Aarohi","age":23,"city":"Delhi","bio":"…","interests":["Photography"],"photoUrl":"/demo-profiles/aarohi.svg"}}]}
```

Returns `{"matches":[]}` when there are no mutual connections.

### `POST /api/demo/reset`

Send `{}`. Clears only the caller's outgoing swipes and matches; returns `{"success":true}`. No target session ID is accepted or used. Other browsers remain unchanged.

### Errors

| Status | Meaning |
| --- | --- |
| 400 | Malformed JSON or invalid profile ID/direction/body |
| 403 | Cross-site mutation attempt |
| 404 | Target profile does not exist |
| 409 | Profile already swiped in the opposite direction |
| 503 | Database unavailable or not configured |

Errors have the shape `{"error":"A useful message."}`. Database details and credentials are never included in client errors.

## Tests and commands

Start and seed a dedicated local database first. Database tests create independent sessions and clean them up. Browser tests also use isolated browser cookies, and leave demo sessions in the test database; do not run them against a database containing real user data.

```sh
npm run typecheck
npm run lint
npm test
npx playwright install chromium
npm run build
npm run test:e2e
npm start
```

Playwright starts its own production server on port 3100, so run `npm run build` first. It runs both desktop Chromium and mobile Chromium with iPhone dimensions and touch support. Tests exercise actual touch dragging, mouse dragging, buttons, keyboard controls, celebration, matches, reloads, empty states, reset, failure recovery, all image URLs, API validation, privacy, concurrency, and session isolation. Screenshots go into `docs/screenshots/`. To use an installed Edge browser instead, set `PLAYWRIGHT_CHANNEL=msedge` in your terminal.

Vitest exercises the matching service against PostgreSQL, including persistence, one-sided likes, passes, public projections, concurrent requests, database constraints, independent sessions, and reset isolation. It does not substitute an in-memory database.

| Script | Purpose |
| --- | --- |
| `dev` | Development server |
| `build` / `start` | Production build / server |
| `lint` / `typecheck` | Static checks |
| `test` / `test:e2e` | Database integration / browser tests |
| `db:local` | Persistent local PostgreSQL |
| `db:migrate` / `db:seed` | Apply tracked SQL migrations / upsert fixtures |

See [VALIDATION.md](VALIDATION.md) for the checks actually run during implementation.

## Deploy to Vercel with Neon

1. Create a new Neon project, set the connection URL in your local environment, and run `db:migrate` followed by `db:seed` against that database.
2. Push this source to a new public GitHub repository named `coy-discover-assignment`.
3. Import that repository as a **new** Vercel project. Add `DATABASE_URL` to the appropriate Production and Preview environments. Set the Node.js version to 24.x.
4. Deploy using the included Next.js configuration. The API handlers explicitly use the Node.js runtime; the app's local portraits and fonts are included in the deployment.
5. Verify `/feed`, a swipe, a confirmed match, and reload persistence on the live URL. Verify that a separate browser has a separate demo history.

Migrations run explicitly, rather than on every function invocation or build. Keep Preview and Production databases separate. Never run a destructive development reset or replace an unrelated Vercel project. Preserve the production database across deploys for session continuity.

If repository creation is not available in your environment, these commands prepare the requested public repo after GitHub CLI authentication:

```sh
gh auth login
gh repo create coy-discover-assignment --public --source=. --remote=origin --push
```

## Project map

```text
src/app/                 Pages and exact API routes
src/components/          Shared shell and accessible dialogs
src/components/discover/ Swipe cards, controls, and celebration
src/components/matches/ Mutual match grid and profile details
src/lib/db/              PostgreSQL client, schema, SQL migrations
src/lib/matching/        Transactional business rules
src/lib/session/         HTTP-only anonymous sessions
src/lib/validation/      Zod request schema
src/data/                Fictional seed fixtures (server tooling only)
public/demo-profiles/    36 original local SVG illustrations
scripts/                Local PostgreSQL, migration, seeding
tests/                  Database integration and browser tests
docs/screenshots/        Actual app screenshots
```

## Decisions and limitations

- **One application:** Next.js keeps this assignment easy to review and run; separate services would add little value.
- **PostgreSQL:** Persistence, row locks, and unique constraints protect matching across simultaneous requests. Neon is the intended hosted PostgreSQL provider.
- **Server-side matching:** A client must never decide whether another person liked it. Only verified matches cross the API boundary.
- **Illustrations:** Original vector portraits are bundled and predictable. No real people's identities are attached to fictional bios. See [asset attribution](public/demo-profiles/ATTRIBUTION.md).
- **Demo identity:** Cookies provide isolation, not production authentication. There is no recovery across browsers or after cookie deletion.
- **Finite fixtures:** Thirty-six profiles and private incoming likes simulate discovery. No real user data, preferences, messaging, account management, moderation, or anti-abuse infrastructure is included.
- **Operational scope:** Demo sessions do not yet expire from the database automatically. A public production product would need retention, rate limiting, monitoring, and real user consent and safety workflows.
- **Hosting setup:** A live deployment requires a Neon URL configured in Vercel. A successful local test run is not evidence of a completed live deployment.

For a plain-English interview explanation, read [PROJECT_WALKTHROUGH.md](PROJECT_WALKTHROUGH.md).
