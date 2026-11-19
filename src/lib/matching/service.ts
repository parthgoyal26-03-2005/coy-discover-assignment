import { and, eq, notExists, desc } from 'drizzle-orm';
import { getDb } from '../db/client';
import { incomingLikes, matches, profiles, sessions, swipes } from '../db/schema';
import type { Direction } from '../types';

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
// Explicit projection: never spread database rows into public API responses.
export const publicProfile = {
  id: profiles.id, name: profiles.name, age: profiles.age, city: profiles.city,
  bio: profiles.bio, interests: profiles.interests, photoUrl: profiles.photoUrl,
};
export async function createSession() {
  return getDb().transaction(async tx => {
    const [session] = await tx.insert(sessions).values({}).returning();
    const roster = await tx.select({ id: profiles.id }).from(profiles).orderBy(profiles.sortOrder);
    // Private demo fixtures. The feed ordering is independent of these records.
    const reciprocal = roster.filter((_, i) => [0, 2, 6, 10, 14, 18, 23, 28, 33].includes(i));
    if (reciprocal.length) await tx.insert(incomingLikes).values(reciprocal.map(p => ({ sessionId: session.id, profileId: p.id })));
    return session.id;
  });
}
export async function feed(sessionId: string) {
  return getDb().select(publicProfile).from(profiles).where(notExists(
    getDb().select({ id: swipes.id }).from(swipes).where(and(eq(swipes.sessionId, sessionId), eq(swipes.profileId, profiles.id)))
  )).orderBy(profiles.sortOrder);
}
export async function swipe(sessionId: string, profileId: string, direction: Direction) {
  return getDb().transaction(async tx => {
    // All session mutations share this row lock, including reset. Concurrent requests serialize.
    await tx.select().from(sessions).where(eq(sessions.id, sessionId)).for('update');
    const [profile] = await tx.select(publicProfile).from(profiles).where(eq(profiles.id, profileId));
    if (!profile) throw new ApiError(404, 'Profile not found.');
    const [previous] = await tx.select().from(swipes).where(and(eq(swipes.sessionId, sessionId), eq(swipes.profileId, profileId)));
    if (previous) {
      if (previous.action !== direction) throw new ApiError(409, 'This profile has already been swiped.');
      return { success: true, isMatch: false }; // idempotent retry; no second celebration
    }
    await tx.insert(swipes).values({ sessionId, profileId, action: direction });
    if (direction === 'like') {
      const [incoming] = await tx.select().from(incomingLikes).where(and(eq(incomingLikes.sessionId, sessionId), eq(incomingLikes.profileId, profileId)));
      if (incoming) {
        await tx.insert(matches).values({ sessionId, profileId });
        return { success: true, isMatch: true, profile };
      }
    }
    return { success: true, isMatch: false };
  });
}
export async function listMatches(sessionId: string) {
  return getDb().select({ id: matches.id, matchedAt: matches.createdAt, profile: publicProfile }).from(matches)
    .innerJoin(profiles, eq(matches.profileId, profiles.id))
    .innerJoin(swipes, and(eq(swipes.sessionId, matches.sessionId), eq(swipes.profileId, matches.profileId), eq(swipes.action, 'like')))
    .innerJoin(incomingLikes, and(eq(incomingLikes.sessionId, matches.sessionId), eq(incomingLikes.profileId, matches.profileId)))
    .where(eq(matches.sessionId, sessionId)).orderBy(desc(matches.createdAt));
}
export async function resetSession(sessionId: string) {
  await getDb().transaction(async tx => {
    await tx.select().from(sessions).where(eq(sessions.id, sessionId)).for('update');
    await tx.delete(matches).where(eq(matches.sessionId, sessionId));
    await tx.delete(swipes).where(eq(swipes.sessionId, sessionId));
  });
}
