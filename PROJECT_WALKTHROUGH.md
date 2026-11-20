# Understanding Coy Discover

[Repository overview](README.md) | [API guide](docs/API_ARCHITECTURE.md) | [Database guide](docs/DATABASE.md) | [Matching algorithm](docs/MATCHING_LOGIC.md)

## What does the software do?

It is an independent implementation of Coy's Part B assignment. A visitor browses 36 fictional adults and likes or passes. Only mutual likes become visible matches. Home is deliberately a placeholder. Start with [Discover's page](src/app/discover/page.tsx), [Discover's component](src/components/discover/discover.tsx), and [Home](src/app/home/page.tsx).

## What happens when I open Discover?

`loadProfiles()` calls the browser [api helper](src/lib/api.ts) with `/feed`. The [feed handler](src/app/feed/route.ts) asks [getSession()](src/lib/session/session.ts) for this browser's identity. That function checks the `coy_session` cookie against PostgreSQL. Missing, malformed, or unknown cookies get a new server-generated session UUID and an HTTP-only cookie.

The [service's createSession()](src/lib/matching/service.ts) also creates private simulated incoming likes for the new session. `feed()` returns public fields for profiles this session has not already swiped. Discover then requests `/matches` for the count. These calls are sequential so the first response can set the cookie before the second request uses it.

## Where do the 36 profiles come from?

[src/data/profiles.ts](src/data/profiles.ts) contains fictional names, adult ages, biographies, cities, interests, local portrait paths, and stable ordering. [scripts/seed.ts](scripts/seed.ts) inserts or updates them in PostgreSQL by fixed ID. The browser receives public fields through the API; it never imports that seed module. Portraits live under [public/demo-profiles/](public/demo-profiles/ATTRIBUTION.md).

## What happens when I swipe right?

The [profile card](src/components/discover/profile-card.tsx) reports a completed drag to `submitSwipe()` in [Discover](src/components/discover/discover.tsx). The Like button and right-arrow shortcut use that same function. It sends `{ profileId, direction: "like" }` to [POST /swipe](src/app/swipe/route.ts).

The handler checks the request origin, parses JSON, validates the UUID/action with [Zod](src/lib/validation/swipe.ts), and gets the session from the cookie. It calls [swipe()](src/lib/matching/service.ts). The service saves a new decision and checks whether that same profile has a private incoming like for that same session.

The frontend removes the profile only after success. If the response confirms a newly created match, [MatchCelebration](src/components/discover/match-celebration.tsx) opens. On failure, the card remains and an error is shown; a rejected drag returns to rest. A ref prevents a second input before React has rendered disabled buttons.

## What happens when I swipe left?

The path is the same, but `direction` is `pass`. [swipe()](src/lib/matching/service.ts) saves the pass without checking for a new match. The profile disappears from this session's feed, including after refresh. A pass never creates a match, even if a private incoming like exists.

## How does it know whether two people like each other?

This demo simulates the other person's choice in `incoming_likes`. An outgoing like belongs to the visitor and is stored in `swipes`; an incoming like simulates a profile's prior interest in that visitor. Both records must have the same session/profile pair.

In [the seed roster](src/data/profiles.ts), Aarohi is first, Kabir second, and Meera third. [createSession()](src/lib/matching/service.ts) privately selects certain positions for reciprocal fixtures. Liking Aarohi creates a match. Liking Kabir does not. Passing Meera does not, even though her fixture contains an incoming like. [The matching guide](docs/MATCHING_LOGIC.md) explains each step and retry behavior.

## Why doesn't it reveal a secret one-sided like?

The [service's publicProfile projection](src/lib/matching/service.ts) is an explicit list of displayable fields. The feed query never joins incoming likes or orders by them. A non-match response contains only `success` and `isMatch: false`; it does not reveal a hidden flag or count.

[listMatches()](src/lib/matching/service.ts) checks both an outgoing like and an incoming like again before returning a match. [HTTP helpers](src/lib/http.ts) mark responses private/no-store and hide unexpected database errors. [The Matches view](src/components/matches/matches-view.tsx) only displays those server-verified connections.

## Where is the swipe saved, and what happens after reload?

The swipe is a PostgreSQL row, written through [Drizzle in the matching service](src/lib/matching/service.ts), using [the connection pool](src/lib/db/client.ts). React state is temporary and no swipe is stored in localStorage.

After reload, the same cookie identifies the session. `/feed` excludes all its existing decisions, and `/matches` restores its mutual connections. Clearing cookies or changing browser creates a different anonymous identity; there is no account recovery. [getSession()](src/lib/session/session.ts) controls that boundary.

## How do the five tables connect?

[The Drizzle schema](src/lib/db/schema.ts) defines:

- `profiles`: the people shown in cards.
- `demo_sessions`: one anonymous browser identity.
- `swipes`: the browser's outgoing decisions, referencing a session and profile.
- `incoming_likes`: private simulated interest, referencing the same two tables.
- `matches`: confirmed connections, also referencing a session and profile.

Unique session/profile pairs prevent duplicate decisions and matches. Incoming likes use that pair as a composite primary key. Deleting a session directly cascades to its interactions, but the application's reset does not delete the session. See [the ER diagram and column guide](docs/DATABASE.md).

## Why use Next.js, Drizzle, and Neon PostgreSQL?

Next.js keeps [pages and API handlers](src/app/) in one small deployable project. React handles the interface; TypeScript catches incompatible shapes; [Zod](src/lib/validation/swipe.ts) checks real request data at runtime. Drizzle provides typed SQL access. [Neon supplies PostgreSQL](src/lib/db/client.ts), whose records persist across refresh and deployment. Motion handles gestures and Radix supplies accessible dialogs in [dialog.tsx](src/components/ui/dialog.tsx).

## Why need transactions and unique constraints?

A transaction saves a swipe and its match together, or rolls back both. In [swipe()](src/lib/matching/service.ts), the service locks the session row before reading or changing interaction state. Two simultaneous decisions for that session therefore execute in sequence.

An identical repeat succeeds without another match or celebration. An opposite repeat returns 409 and keeps the first decision. Unique indexes in [schema.ts](src/lib/db/schema.ts) independently protect against duplicate rows, including writes that bypass the service. Locks give predictable application behavior; constraints enforce database invariants. [The integration tests](tests/matching.test.ts) exercise both.

## What does reset do?

[The reset route](src/app/api/demo/reset/route.ts) checks origin and resolves the cookie session. Its body cannot select a different session. [resetSession()](src/lib/matching/service.ts) takes the same session lock as swipe, deletes that session's matches and outgoing decisions, and commits. It retains profiles, incoming fixtures, the session/cookie, and other browsers' history. [Shell](src/components/shell.tsx) reloads or navigates to Discover; the exhausted-feed replay action loads the feed again.

## How do I run and test it?

Follow [README installation](README.md#local-installation), set your own database URL in ignored `.env.local`, and run migration, seed, and development commands. [migrate.ts](scripts/migrate.ts) tracks the existing SQL migration and prevents two migrators from applying it together. No migration is needed for readability changes.

Use a separate database for [Vitest integration tests](tests/matching.test.ts) and [Playwright browser tests](tests/e2e/discover.spec.ts). [GitHub Actions](.github/workflows/verify.yml) provides a disposable PostgreSQL service and runs the same checks on Node.js 24. [VALIDATION.md](VALIDATION.md) reports executed results.

## How would a real product differ?

These are fictional profiles and simulated incoming likes, not independent registered users. Cookies provide demo isolation, not production authentication. A real two-user product would record either user liking first, authenticate ownership, support consent and account recovery, and add moderation, abuse prevention, retention, and monitoring. Chat, OTP, invitations, and payments are outside this assignment. The [limitations in README](README.md#scope-and-limitations) explain this scope.

## Two-minute interview explanation

"Coy Discover is my standalone implementation of the assignment's discovery tab. A visitor can browse 36 fictional adult profiles, like or pass by touch, mouse, buttons, or keyboard, and see mutual matches. Home is intentionally a placeholder.

Next.js serves both the React interface and four API routes. A random HTTP-only cookie identifies an anonymous demo session stored in PostgreSQL. The feed returns profiles that session has not already swiped, so decisions survive reloads without localStorage.

The matching service is separate from the routes. It validates the target and saves an outgoing decision inside a transaction. Only a like checks the private incoming-like fixture for that same session and profile. If both sides exist, it inserts a match and the frontend celebrates after the server confirms it.

To handle repeated requests, swipe and reset lock the session row. Unique indexes additionally prevent duplicate swipes and matches. An identical retry succeeds without another celebration; an opposite action returns a conflict. Public projections and verified match queries keep one-sided likes private.

Drizzle provides typed database queries and Neon hosts PostgreSQL. I verify matching, concurrency, privacy, and reset against a separate real test database, plus desktop and mobile browser tests. The incoming likes are simulated for a repeatable assignment demo; real accounts and production safety infrastructure are outside its scope."
