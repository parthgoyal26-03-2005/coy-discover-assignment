import { and, desc, eq, notExists } from 'drizzle-orm';
import { getDb } from '../db/client';
import {
  incomingLikes,
  matches,
  profiles,
  sessions,
  swipes,
} from '../db/schema';
import type { Direction } from '../types';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

// Select displayable fields explicitly: never expose private fixtures or database rows.
export const publicProfile = {
  id: profiles.id,
  name: profiles.name,
  age: profiles.age,
  city: profiles.city,
  bio: profiles.bio,
  interests: profiles.interests,
  photoUrl: profiles.photoUrl,
};

// Positions in the sorted demo roster, independent of the public feed query.
const reciprocalProfilePositions = [0, 2, 6, 10, 14, 18, 23, 28, 33];

export async function createSession() {
  // Create the session and its private incoming likes together, or neither.
  return getDb().transaction(async (transaction) => {
    const [session] = await transaction.insert(sessions).values({}).returning();
    const sortedProfiles = await transaction
      .select({ id: profiles.id })
      .from(profiles)
      .orderBy(profiles.sortOrder);
    const reciprocalProfiles = sortedProfiles.filter((_, position) =>
      reciprocalProfilePositions.includes(position),
    );

    if (reciprocalProfiles.length > 0) {
      await transaction
        .insert(incomingLikes)
        .values(
          reciprocalProfiles.map((profile) => ({
            sessionId: session.id,
            profileId: profile.id,
          })),
        );
    }

    return session.id;
  });
}

export async function feed(sessionId: string) {
  const database = getDb();
  // Exclude both likes and passes; incoming likes never influence feed ordering.
  return database
    .select(publicProfile)
    .from(profiles)
    .where(
      notExists(
        database
          .select({ id: swipes.id })
          .from(swipes)
          .where(
            and(
              eq(swipes.sessionId, sessionId),
              eq(swipes.profileId, profiles.id),
            ),
          ),
      ),
    )
    .orderBy(profiles.sortOrder);
}

export async function swipe(
  sessionId: string,
  profileId: string,
  direction: Direction,
) {
  // Persist the swipe and any match atomically; an error rolls back both writes.
  return getDb().transaction(async (transaction) => {
    // Swipe and reset share this row lock, serializing mutations in this session.
    await transaction
      .select()
      .from(sessions)
      .where(eq(sessions.id, sessionId))
      .for('update');
    const [profile] = await transaction
      .select(publicProfile)
      .from(profiles)
      .where(eq(profiles.id, profileId));
    if (!profile) {
      throw new ApiError(404, 'Profile not found.');
    }

    const [previousSwipe] = await transaction
      .select()
      .from(swipes)
      .where(
        and(eq(swipes.sessionId, sessionId), eq(swipes.profileId, profileId)),
      );
    if (previousSwipe) {
      if (previousSwipe.action !== direction) {
        throw new ApiError(409, 'This profile has already been swiped.');
      }
      // A retry succeeds without creating or celebrating the same match twice.
      return { success: true, isMatch: false };
    }

    await transaction
      .insert(swipes)
      .values({ sessionId, profileId, action: direction });
    if (direction === 'like') {
      const [incomingLike] = await transaction
        .select()
        .from(incomingLikes)
        .where(
          and(
            eq(incomingLikes.sessionId, sessionId),
            eq(incomingLikes.profileId, profileId),
          ),
        );
      if (incomingLike) {
        await transaction.insert(matches).values({ sessionId, profileId });
        return { success: true, isMatch: true, profile };
      }
    }
    return { success: true, isMatch: false };
  });
}

export async function listMatches(sessionId: string) {
  // Recheck both likes so even an inconsistent match row cannot expose a unilateral like.
  return getDb()
    .select({
      id: matches.id,
      matchedAt: matches.createdAt,
      profile: publicProfile,
    })
    .from(matches)
    .innerJoin(profiles, eq(matches.profileId, profiles.id))
    .innerJoin(
      swipes,
      and(
        eq(swipes.sessionId, matches.sessionId),
        eq(swipes.profileId, matches.profileId),
        eq(swipes.action, 'like'),
      ),
    )
    .innerJoin(
      incomingLikes,
      and(
        eq(incomingLikes.sessionId, matches.sessionId),
        eq(incomingLikes.profileId, matches.profileId),
      ),
    )
    .where(eq(matches.sessionId, sessionId))
    .orderBy(desc(matches.createdAt));
}

export async function resetSession(sessionId: string) {
  await getDb().transaction(async (transaction) => {
    await transaction
      .select()
      .from(sessions)
      .where(eq(sessions.id, sessionId))
      .for('update');
    // Keep profiles, the session cookie, and incoming fixtures for replay; scope every delete.
    await transaction.delete(matches).where(eq(matches.sessionId, sessionId));
    await transaction.delete(swipes).where(eq(swipes.sessionId, sessionId));
  });
}
