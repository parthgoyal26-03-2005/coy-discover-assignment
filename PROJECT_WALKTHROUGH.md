# Explaining Coy Discover in an interview

Coy Discover is a proposed discovery tab, built independently for Part B of the Coy SDE internship assignment. The Home tab is a placeholder. Discover lets a visitor browse 36 fictional adults, like or pass, and see mutual matches. There is no authentication, chat, payment, or integration with Coy's production app.

## The journey

1. Open Discover. The browser calls `GET /feed`.
2. The server creates an anonymous demo session if needed and stores its random ID in an HTTP-only cookie. It also creates private incoming-like fixtures for that session.
3. The database returns only profiles without a recorded swipe in that session.
4. A drag, button, or keyboard arrow sends `POST /swipe`.
5. The server validates the input and starts a database transaction. It locks the session row, checks for an existing swipe, and writes the action.
6. Only a like can trigger a reciprocal-like check. If the private incoming like exists, the server creates a match and returns the matched profile.
7. The browser celebrates only after that response. `GET /matches` supplies the Matches screen.

## Why the database matters

React state makes the screen responsive, but PostgreSQL is the source of truth. A reload loses React state and then reconstructs it from the database using the same cookie. No swipe or match is stored in localStorage.

Five tables keep the model simple: profiles, demo sessions, outgoing swipes, private incoming likes, and matches. Swipes and matches each have a unique pair of session ID and profile ID. That means a bug or retry cannot create two copies.

## A concrete matching example

Aarohi is privately seeded as having liked this demo user. Liking her creates a match. Kabir has no incoming like, so liking him records a swipe without matching. Passing Meera never creates a match, even though she has an incoming like. These fixtures exist to make the demo reproducible, and are never returned in the feed.

The implementation is in `src/lib/matching/service.ts`. It is deliberately separate from the route handlers and React components so it can be tested against PostgreSQL directly.

## Privacy and concurrency

Public responses use an explicit list of displayable fields. They never include incoming-like records or flags. The feed uses the same order regardless of incoming likes. The Matches query checks both sides again before returning anything.

All mutations lock the current session row until their transaction finishes. Two simultaneous likes therefore run one after the other. The first can create a match; an identical retry succeeds without creating or celebrating another match. A contradictory retry gets HTTP 409. Reset uses the same lock, so it cannot interrupt a swipe halfway through.

## Why this stack?

Next.js puts React pages and API routes in one project. TypeScript catches mismatched data shapes. Zod validates actual requests, because TypeScript alone does not validate network data. Drizzle provides readable typed SQL access. PostgreSQL provides persistent records, constraints, and transactions. Motion handles drag movement and card transitions. Radix handles dialog focus and Escape behavior.

## What to demonstrate

Like the first profile to show a match, view the Matches screen, reload, then return to Discover. Like the second profile to show that a like alone is insufficient. Pass the third. Open Home to show the intentionally blank placeholder. Reset the demo using the header control.

## Be honest about the limits

This is a demo, with fictional profiles, illustrated portraits, and seeded reciprocal likes. Browser cookies identify anonymous users; they are not production authentication. Cookie deletion creates a new demo identity. Real accounts, moderation, abuse prevention, retention policies, profile preferences, and real-time reciprocal likes would require more work. Neon and Vercel need account configuration before a public deployment can function.
