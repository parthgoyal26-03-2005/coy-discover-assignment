# Mutual matching

[Overview](../README.md) · [API architecture](API_ARCHITECTURE.md) · [Database](DATABASE.md) · [Walkthrough](../PROJECT_WALKTHROUGH.md)

The implementation lives in [src/lib/matching/service.ts](../src/lib/matching/service.ts). A match requires an outgoing **like** and a private incoming like for the **same session and profile**. Passing never matches. The browser only celebrates a newly confirmed match returned by the server.

## Three concrete examples

These examples use [the existing fictional roster](../src/data/profiles.ts) and `createSession()`'s private fixtures:

| Action | Private fixture | Stored result | Public response |
| --- | --- | --- | --- |
| Like Aarohi (`...000001`) | Aarohi has a simulated incoming like | One swipe and one match | `success: true`, `isMatch: true`, public Aarohi profile |
| Like Kabir (`...000002`) | No incoming like | One swipe; no match | `success: true`, `isMatch: false` |
| Pass Meera (`...000003`) | Meera has a simulated incoming like | One pass; no match | `success: true`, `isMatch: false` |

The abbreviated IDs end with those digits; the full first UUID is `00000000-0000-4000-8000-000000000001`. These fixture facts are documented for interview review, not returned as hidden-like flags in the product.

## Transaction lifecycle

`swipe(sessionId, profileId, direction)` begins a PostgreSQL transaction and takes a `SELECT ... FOR UPDATE` lock on the current session row. All swipe and reset operations use this lock. Requests for one session run in sequence; requests for different sessions lock different rows.

While holding the lock, the service confirms the profile exists and checks for an existing decision. A new decision is saved first. Only a `like` performs the private incoming-like lookup. If that lookup succeeds, a match is inserted before the transaction commits. Throwing an error rolls back the transaction, so the caller cannot observe a partly saved swipe/match pair.

```text
swipe(sessionId, profileId, direction):
    begin transaction
    lock this session row for update
    find target profile, or fail with 404
    find previous swipe for this session and profile
    if a previous swipe exists:
        if its action differs: fail with 409
        return success with isMatch = false
    save the new swipe
    if direction is like:
        look up a private incoming like for this same pair
        if it exists:
            save one match
            return success with isMatch = true and public profile
    return success with isMatch = false
    commit on success; roll back on failure
```

Returns in the pseudocode leave the transaction callback; Drizzle commits successfully before its outer promise resolves. The lock is released when the transaction commits or rolls back.

## Concurrent requests and retries

Suppose two identical likes arrive together. The first request acquires the session lock, writes the swipe and match, and commits. The second then acquires the lock and sees the existing swipe. It returns `{ "success": true, "isMatch": false }` without another insert. This is an idempotent retry, not a claim that the previously created match disappeared. `/matches` still returns that match.

A contradictory repeat action returns **409**, preserving the first decision. For example, a like after an earlier pass does not overwrite that pass. An unknown profile returns **404** without creating a swipe.

The `unique_swipe` and `unique_match` indexes also enforce one row per `(session_id, profile_id)`. They protect uniqueness even if another writer bypasses the application's lock. They do not replace the transaction: the lock lets the service return predictable retry behavior and coordinates reset with swipe.

`resetSession()` uses the same session lock, so a reset cannot delete half of an in-progress swipe. Depending on which request obtains the lock first, the final state is either reset or contains the subsequently completed swipe, with a consistent match state.

## Privacy boundary

- `publicProfile` explicitly selects `id`, `name`, `age`, `city`, `bio`, `interests`, and `photoUrl`. Database rows are not spread into responses.
- `feed()` excludes saved swipes and orders by `sort_order`. It does not join incoming likes or change order based on them.
- `isMatch: false` is returned for both a pass and a non-mutual like. No incoming-like count, flag, or fixture list is exposed.
- `listMatches()` joins the outgoing swipe with action `like` and the incoming like again, scoped to the current session. An inconsistent match row alone is insufficient.
- [getSession()](../src/lib/session/session.ts) derives the session from an HTTP-only cookie validated against PostgreSQL. A swipe body cannot select another session. Mutation routes also reject cross-site requests.

## What the frontend does

[Discover](../src/components/discover/discover.tsx) sends the decision through [api()](../src/lib/api.ts). Its in-flight ref immediately prevents duplicate input while React updates the disabled buttons. A profile is removed only after a successful response. A failed request leaves the profile available for retry; a rejected drag returns the card to its resting position in [ProfileCard](../src/components/discover/profile-card.tsx).

Only `isMatch: true` with a profile opens [MatchCelebration](../src/components/discover/match-celebration.tsx). A repeated request therefore does not produce a second celebration. On refresh, PostgreSQL restores the feed and matches using the same session cookie; React state and animations do not determine whether a match exists.

## Demo versus a real two-user product

The nine incoming likes are simulated when each demo session is created. They are not actions from real registered users. A real product would record two authenticated users' independent decisions, handle either user liking first, and enforce consent, identity, retention, moderation, and abuse controls. This assignment deliberately keeps those features out of scope.

[Matching integration tests](../tests/matching.test.ts) exercise mutual likes, passes, one-sided likes, retries, conflicting repeats, concurrency, database constraints, session isolation, and reset. [Browser tests](../tests/e2e/discover.spec.ts) verify the resulting interface and persistence against a real test database.
