# Validation record

Verified on 19 November 2026 (Asia/Calcutta).

## Successful checks

| Check | Actual result |
| --- | --- |
| `npm run lint` | Passed, zero errors and warnings |
| `npm run typecheck` | Passed, including Next.js route type generation |
| `npm run build` | Passed, Next.js 16.4.6 production build, all 11 routes generated |
| `npm test` with local PostgreSQL 18.6 | 18/18 passed |
| `npm test` with Neon PostgreSQL | 18/18 passed, 62.66 seconds |
| `npm run test:e2e` with production Next.js and Neon | 12/12 passed, desktop and touch-enabled mobile Chromium, 3.2 minutes |
| Migration and seeding | Applied successfully on both local PostgreSQL and Neon; repeated locally without duplicate profiles |
| Local profile images | All 36 asset URLs returned 200 with SVG content types in browser tests |
| Screenshots | Six actual screenshots captured and visually reviewed; no development UI overlays |
| Secret exclusion | Supplied database credentials absent from tracked source; local environment files, database files, dependencies, and build output ignored |

## Behaviors exercised

- A fresh session receives 36 complete, adult, unswiped profiles.
- Like and pass persist in PostgreSQL; neither target returns after reload.
- A mutual like creates one match and a server-confirmed celebration.
- A one-sided like and a pass never create a match.
- Feed and match responses expose only displayable profile fields and verified mutual matches.
- Concurrent identical submissions produce exactly one swipe and one match. Contradictory retries return 409.
- Browser sessions are isolated. Reset clears only the current session and preserves reciprocal fixtures for replay.
- The database independently rejects duplicate swipe records.
- Invalid JSON and invalid bodies return 400; unknown targets return 404; cross-site reset attempts return 403.
- Actual touch and mouse drag gestures work; short drags recover; arrow keys and buttons work.
- Dialog opening focuses the close control; Escape dismisses profile details.
- A failed swipe leaves the profile in place and allows a successful retry.
- Empty feed and empty matches states work; reset restores all profiles.
- The mobile Like button stays above the fixed navigation; no horizontal page overflow was detected.
- Home navigation reaches the intentionally blank placeholder.

## Environment notes

The Neon database was empty before the assignment schema was applied. The final browser suite ran against a production server, rather than a development server, with production Secure cookies on localhost. Hosted HTTPS verification follows deployment.

The local machine uses Node.js 22.12.0. It completed these checks, but one lint dependency declares 22.13+; Node.js 24 is configured for Vercel and CI and recommended for new installations. The installed PostgreSQL connection library emits a notice about future `sslmode=require` semantics; the current driver verifies certificates. No database credentials are included in this report.
