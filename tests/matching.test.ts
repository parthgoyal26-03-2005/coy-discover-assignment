import { afterAll, afterEach, describe, expect, it } from 'vitest';
import { and, eq } from 'drizzle-orm';
import { getDb } from '../src/lib/db/client';
import { sessions, swipes, matches, profiles, incomingLikes } from '../src/lib/db/schema';
import { createSession, feed, swipe, listMatches, resetSession } from '../src/lib/matching/service';
import { swipeInput } from '../src/lib/validation/swipe';

const sessionIds: string[] = [];
async function session() { const id = await createSession(); sessionIds.push(id); return id; }
const profileId = (i: number) => `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`;
afterEach(async () => { for (const id of sessionIds.splice(0)) await getDb().delete(sessions).where(eq(sessions.id, id)); });
afterAll(async () => { const state = globalThis as unknown as { coyPool?: { end: () => Promise<void> } }; await state.coyPool?.end(); delete state.coyPool; });

describe('PostgreSQL mutual matching and privacy', () => {
  it('returns all 36 initially unswiped adult profiles', async () => {
    const result = await feed(await session());
    expect(result).toHaveLength(36);
    expect(new Set(result.map(p => p.id)).size).toBe(36);
    expect(result.every(p => p.age >= 18 && p.interests.length >= 3)).toBe(true);
  });
  it('records LIKE in PostgreSQL', async () => {
    const id = await session(); await swipe(id, profileId(2), 'like');
    expect((await getDb().select().from(swipes).where(eq(swipes.sessionId, id)))[0].action).toBe('like');
  });
  it('records PASS in PostgreSQL', async () => {
    const id = await session(); await swipe(id, profileId(1), 'pass');
    expect((await getDb().select().from(swipes).where(eq(swipes.sessionId, id)))[0].action).toBe('pass');
  });
  it('creates a match only for a mutual LIKE', async () => {
    const id = await session(); const result = await swipe(id, profileId(1), 'like');
    expect(result.isMatch).toBe(true); expect(await listMatches(id)).toHaveLength(1);
  });
  it('never matches a one-sided LIKE', async () => {
    const id = await session(); expect((await swipe(id, profileId(2), 'like')).isMatch).toBe(false);
    expect(await listMatches(id)).toEqual([]);
  });
  it('never matches PASS even with an incoming like', async () => {
    const id = await session(); expect((await swipe(id, profileId(3), 'pass')).isMatch).toBe(false);
    expect(await listMatches(id)).toEqual([]);
  });
  it('does not expose incoming likes or seed ordering fields in public projections', async () => {
    const result = await feed(await session());
    for (const p of result) expect(Object.keys(p).sort()).toEqual(['age','bio','city','id','interests','name','photoUrl']);
    expect(JSON.stringify(result)).not.toMatch(/incoming|sortOrder|sessionId|isMatch/);
  });
  it('never returns swiped profiles, including across fresh reads', async () => {
    const id = await session(); await swipe(id, profileId(1), 'pass'); await swipe(id, profileId(2), 'like');
    for (let i = 0; i < 2; i++) {
      const result = await feed(id); expect(result).toHaveLength(34); expect(result.some(p => p.id === profileId(1) || p.id === profileId(2))).toBe(false);
    }
  });
  it('persists matches across independent reads', async () => {
    const id = await session(); await swipe(id, profileId(1), 'like');
    const first = await listMatches(id); expect(await listMatches(id)).toEqual(first);
    expect(first[0].profile.name).toBe('Aarohi');
  });
  it('rejects invalid inputs including extra fields', () => {
    for (const body of [null, {}, { profileId: 'no', direction: 'like' }, { profileId: profileId(1), direction: 'up' }, { profileId: profileId(1), direction: 'like', sessionId: 'other' }]) expect(swipeInput.safeParse(body).success).toBe(false);
  });
  it('rejects nonexistent targets without creating a swipe', async () => {
    const id = await session(); await expect(swipe(id, profileId(999), 'like')).rejects.toMatchObject({ status: 404 });
    expect(await getDb().select().from(swipes).where(eq(swipes.sessionId, id))).toHaveLength(0);
  });
  it('serializes duplicate concurrent swipes and creates exactly one match', async () => {
    const id = await session(); const results = await Promise.all(Array.from({ length: 8 }, () => swipe(id, profileId(1), 'like')));
    expect(results.filter(r => r.isMatch)).toHaveLength(1);
    expect(await getDb().select().from(swipes).where(eq(swipes.sessionId, id))).toHaveLength(1);
    expect(await getDb().select().from(matches).where(eq(matches.sessionId, id))).toHaveLength(1);
  });
  it('rejects contradictory duplicate swipes', async () => {
    const id = await session(); await swipe(id, profileId(1), 'pass');
    await expect(swipe(id, profileId(1), 'like')).rejects.toMatchObject({ status: 409 });
    expect(await listMatches(id)).toHaveLength(0);
  });
  it('isolates different browser sessions', async () => {
    const a = await session(), b = await session(); await swipe(a, profileId(1), 'like');
    expect(await feed(a)).toHaveLength(35); expect(await feed(b)).toHaveLength(36);
    expect(await listMatches(a)).toHaveLength(1); expect(await listMatches(b)).toHaveLength(0);
  });
  it('resets only the current session, preserving seed data and other sessions', async () => {
    const a = await session(), b = await session(); await swipe(a, profileId(1), 'like'); await swipe(b, profileId(1), 'like');
    await resetSession(a); expect(await feed(a)).toHaveLength(36); expect(await listMatches(a)).toHaveLength(0);
    expect(await listMatches(b)).toHaveLength(1); expect(await feed(b)).toHaveLength(35);
    expect((await swipe(a, profileId(1), 'like')).isMatch).toBe(true);
  });
  it('lists only verified mutual matches even if inconsistent data is inserted', async () => {
    const id = await session(); await getDb().insert(matches).values({ sessionId: id, profileId: profileId(2) });
    expect(await listMatches(id)).toEqual([]);
  });
  it('session reset and concurrent swipe leave a coherent database state', async () => {
    const id = await session(); await Promise.all([swipe(id, profileId(1), 'like'), resetSession(id)]);
    const rows = await getDb().select().from(swipes).where(eq(swipes.sessionId, id));
    const mutual = await listMatches(id); expect(mutual.length).toBe(rows.length);
  });
  it('enforces database constraints independently of application validation', async () => {
    const id = await session(); await swipe(id, profileId(2), 'pass');
    await expect(getDb().insert(swipes).values({ sessionId: id, profileId: profileId(2), action: 'like' })).rejects.toThrow();
    expect(await getDb().select().from(profiles)).toHaveLength(36);
    expect(await getDb().select().from(incomingLikes).where(and(eq(incomingLikes.sessionId, id), eq(incomingLikes.profileId, profileId(1))))).toHaveLength(1);
  });
});
