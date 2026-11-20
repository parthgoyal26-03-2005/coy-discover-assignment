# Final technical review and validation

Reviewed on **20 November 2026 (Asia/Calcutta)**. [Overview](README.md) | [API architecture](docs/API_ARCHITECTURE.md) | [Database](docs/DATABASE.md) | [Matching logic](docs/MATCHING_LOGIC.md)

## Baseline and rollback

Pulled `main` with `--ff-only`; the starting commit was `6f3394d4d5a919f8caa52a2fd8e13570f62c59c2`. A local rollback branch, `rollback/before-submission-review-2026-11-20`, points to it. No history was rewritten. Earlier implementation and deployment evidence is retained in [the archived validation record](docs/archive/VALIDATION_2026-11-19.md); those older counts and commit hashes are historical.

## Review findings and changes

- Routes and schema definitions were excessively compressed. They now separate request checks, session lookup, service work, and response formatting, with descriptive names and readable fields/constraints.
- The matching service retains `createSession`, `feed`, `swipe`, `listMatches`, `resetSession`, `publicProfile`, and `ApiError`. Comments explain transaction boundaries, session locking, public projection, idempotent retries, and session-scoped reset. Matching decisions and fixture positions are unchanged.
- Frontend formatting makes state transitions, keyboard handling, loading/error states, dialog behavior, and animation callbacks easier to follow. The original sequential cookie-establishing request pattern is retained.
- A demonstrated client failure returned raw JSON-parser messages for HTML/non-JSON responses. Two new tests failed against the original helper, then passed after it returned a useful retry message. Successful JSON behavior is unchanged.
- A clean local launch demonstrated `ECONNREFUSED ::1:54329`: embedded PostgreSQL listened on IPv4 while its database-creation helper used localhost/IPv6. The launcher now explicitly uses `127.0.0.1` and handles an existing database by SQLSTATE `42P04`. Actual startup and existing-database handling succeeded.
- Removed unused `@fontsource/dm-sans`. All retained dependency versions, source URLs, and integrity hashes match the baseline lockfile. No runtime/state library was added. The lockfile includes npm's optional/bundled dependency metadata refresh.
- Added focused tests for client non-JSON failures, server error privacy, cross-site mutation rejection, and malformed/unknown session cookie replacement.
- Added API, database, and matching guides, shortened the README, and expanded the walkthrough with actual source links and a two-minute interview explanation. Historical redesign evidence and approved screenshots remain available.

## Checks actually executed

| Check | Actual result |
| --- | --- |
| `npm ci` | Passed; 440 packages installed, zero audit vulnerabilities reported |
| `npm run lint` | Passed; zero errors/warnings on the final source |
| `npm run typecheck` | Passed, including Next.js route type generation |
| `npm test` | **26/26 passed** across three files: 18 real-PostgreSQL matching tests and eight client/HTTP unit tests |
| `npm run build` | Passed; Next.js 16.4.6 production compilation, TypeScript, and 11 static-page generation tasks |
| `npm run test:e2e` | **14/14 passed in 58.1 seconds**: desktop and touch-enabled mobile Chromium |
| Real database-unavailable request | Separate production server pointed at an unavailable local database; `/feed` returned generic 503 JSON with private/no-store, without connection details |
| Visual preservation | Settled layout bounds equal the approved production UI at 1440 x 900, 768 x 1024, and 390 x 844; captures visually inspected |
| Responsive walkthrough | Discover, celebration, Matches, and profile details captured at all three sizes; controls above navigation, no horizontal overflow, zero console/page errors |
| Drizzle schema equivalence | All five table names, columns, types, nullability/default flags, keys, references, checks, and indexes match the baseline |
| Initial SQL migration | Identical after whitespace normalization; no DDL changes or new migration |
| Assets and configuration | CSS, profile fixtures, all public assets, `.env.example`, GitHub Actions workflow, and Vercel configuration unchanged |
| Documentation | Six Mermaid diagrams parsed successfully; internal relative links and screenshot targets checked with no missing paths |
| Secret hygiene | Current files and all 154 baseline Git-history blobs scanned; no supplied hosted credentials, token signatures, private keys, or private email addresses in file contents |

## Data isolation and production preservation

Integration tests, all browser API actions, migrations, and seeding used the dedicated local PostgreSQL 18.6 database **`coy_review_20261120`**. The local production server received its URL through `DATABASE_URL` in the terminal, overriding `.env.local`. Test commands were never directed at Neon production.

Production was inspected with explicit **read-only transactions**. Row counts and ordered content digests were saved for `profiles`, `demo_sessions`, `swipes`, `incoming_likes`, and `matches`, then compared after local verification. All five remained unchanged. No production migration, seed, reset, or application-API mutation was used for this review. The existing 36 production profiles and all interaction records were retained.

The comparison against the deployed approved UI intercepted production API requests and supplied public fixture fields in the browser, avoiding even automatic session creation on production. This comparison verifies presentation, not a live matching transaction. Actual matching, privacy, concurrency, session recovery, reset, and persistence were verified end to end on the dedicated database instead.

## Verified behavior

- Exactly 36 fictional adult profiles and all local portrait URLs load.
- Like, Pass, real mouse/touch drag, short-drag recovery, keyboard arrows, and failed-request retry work.
- A mutual like creates one match and celebration; one-sided likes and passes do not.
- Repeated concurrent likes create one swipe/match and one `isMatch: true` result; contradictory repeats return 409.
- Feed and match responses expose public fields only; inconsistent match rows without both likes are excluded.
- Swipes and matches survive reload. Independent browser sessions remain isolated.
- Reset and concurrent swipe leave coherent state; reset preserves fixtures and other sessions.
- Malformed and unknown UUID cookies are replaced with valid server-owned sessions; cookies are HTTP-only, SameSite=Lax, and Secure on the production test server.
- Invalid JSON/bodies, missing profiles, and cross-site mutations return the intended error statuses. Unexpected database errors are not returned to clients.
- Dialog opening focuses the close control, profile details support Escape, and controls remain above mobile navigation.

## Assignment assessment and remaining scope

The supplied assignment PDF's **Part B** requirements are covered: standalone public app, placeholder Home, mobile-first Discover, at least 30 mock profiles (36 supplied), seeded incoming interest, gestures/buttons/feedback, exhausted state, mutual celebration and Matches, private unilateral interest, the exact three required API paths, and reload persistence. Part A is a separate product-exploration exercise and is outside this repository's scope.

No blocking functionality, privacy, schema, or maintainability issue remained in the local review. Anonymous identity and simulated incoming likes are explicitly demo mechanisms, not production authentication or genuine two-user matching. Automatic session retention, moderation, and rate limiting are documented product limitations rather than features added to the assignment.

## Environment and publication

Local checks ran on Node.js 22.12.0. npm reported that one lint dependency requires 22.13+; it also reported the existing ESLint version's deprecation and native installation-script notices. The production build and tests completed successfully. **Node.js 24 is the documented, configured CI/Vercel version**; the final remote workflow validates that supported runtime. The installed PostgreSQL driver emits an existing notice about future `sslmode=require` semantics during read-only Neon access; the current driver verifies certificates.

[GitHub Actions](https://github.com/parthgoyal26-03-2005/coy-discover-assignment/actions) runs on each push with its own disposable PostgreSQL service. Exact final workflow status, source commit, and deployed commit are checked after publication and reported in the delivery summary, rather than embedding a self-referential commit hash here.

The existing Vercel project and URL are retained. Provider inspection now confirms that the existing project is Git-linked to the intended repository; older documentation claiming it was unconnected has been corrected. The final push uses that automatic integration, and its deployment commit is checked against GitHub main. Production browser verification is read-only: application API requests are intercepted to preserve records; static pages, responsive UI, logo, and all portrait assets are checked. Live production mutation flows are deliberately not rerun during this review; their current implementation is covered on the isolated real database.
