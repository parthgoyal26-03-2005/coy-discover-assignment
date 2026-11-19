# Validation record

Verified on 19 November 2026 (Asia/Calcutta).

## Final branding and publication checks

The final logo correction preserved the existing application and backend. Checks rerun against the finished source:

| Check | Result |
| --- | --- |
| TypeScript and ESLint | Both passed; no lint errors or warnings |
| Production build | Passed; all 11 static-page generation tasks completed |
| Vitest / Neon PostgreSQL | 18/18 passed |
| Playwright / production server / Neon | 12/12 passed, desktop and touch-enabled mobile Chromium, 2.2 minutes |
| Official logo | Exact local official SVG; 76 x 28 CSS pixels on Home, Discover, and Matches at desktop and mobile sizes |
| Metadata | Official local favicon and Apple touch icon configured |
| Visual review | Final Discover desktop/mobile, celebration, and Matches screenshots opened and inspected; tablet also captured |
| Responsive walkthrough | Desktop 1440 x 900, tablet 768 x 1024, mobile 390 x 844; no horizontal overflow, controls above navigation, zero browser console/page errors |
| Security audit | All 136 existing history blobs and current files scanned before the final commit; no supplied hosted credentials, token signatures, private keys, or private email addresses in file contents |
| Exclusions | Environment files, dependencies, build output, local database, and temporary tooling ignored; `.env.example` contains placeholders only |

The official asset sources are documented in `public/brand/README.md`. Final screenshots are in `docs/screenshots/`; earlier redesign comparison images remain historical. Public GitHub `main` is the submission branch. The final deployment commit and public HTTPS smoke results are verified during publication and reported in the delivery message.

The existing Vercel project is retained. Automatic GitHub deployment remains a manual Settings > Git connection step because the available connector cannot reconnect this existing unlinked project. Publication deploys the exact GitHub commit through Vercel's API instead.

## Earlier implementation checks

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
| Deployed profile images | All 36 public portrait URLs returned HTTP 200 with SVG content types |
| Screenshots | Six actual screenshots captured and visually reviewed; no development UI overlays |
| Secret exclusion | Supplied database credentials absent from tracked source; local environment files, database files, dependencies, and build output ignored |
| GitHub Actions | [Verification workflow passed](https://github.com/parthgoyal26-03-2005/coy-discover-assignment/actions/runs/44551376852) on Ubuntu and Node.js 24, using its own PostgreSQL service |
| Vercel | Production deployment reached READY on Node.js 24, source commit `3367b31992b071b279ace675e8830198f44ee38d` |
| Public HTTPS app | [Live app](https://coy-discover-assignment.vercel.app) returned HTTP 200 without Vercel login |
| Live browser smoke check | Passed: 36-profile feed, mutual match, one-sided like, pass, match and swipe reload persistence, secure HTTP-only cookie, session isolation, scoped reset, real mobile touch swipe, Home placeholder, no horizontal overflow, zero browser errors |

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

The Neon database was empty before the assignment schema was applied. The final 12-test browser suite ran against a production server with Neon and production Secure cookies on localhost. A separate browser smoke check then exercised the deployed app over public HTTPS, using independent desktop and mobile contexts.

The local machine uses Node.js 22.12.0. It completed these checks, but one lint dependency declares 22.13+; Node.js 24 is configured for Vercel and CI and recommended for new installations. The installed PostgreSQL connection library emits a notice about future `sslmode=require` semantics; the current driver verifies certificates. No database credentials are included in this report.
