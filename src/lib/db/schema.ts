import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  primaryKey,
  uniqueIndex,
  index,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const profiles = pgTable(
  'profiles',
  {
    id: uuid('id').primaryKey(),
    name: text('name').notNull(),
    age: integer('age').notNull(),
    city: text('city').notNull(),
    bio: text('bio').notNull(),
    interests: text('interests').array().notNull(),
    photoUrl: text('photo_url').notNull(),
    sortOrder: integer('sort_order').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [check('adult_profiles', sql`${table.age} >= 18`)],
);

// A browser session is the owner of every demo interaction.
export const sessions = pgTable('demo_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});
export const swipes = pgTable(
  'swipes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionId: uuid('session_id')
      .references(() => sessions.id, { onDelete: 'cascade' })
      .notNull(),
    profileId: uuid('profile_id')
      .references(() => profiles.id)
      .notNull(),
    action: text('action', { enum: ['like', 'pass'] }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('unique_swipe').on(table.sessionId, table.profileId),
    check('valid_action', sql`${table.action} IN ('like', 'pass')`),
  ],
);
// Private simulated interest, never a field on a public profile.
export const incomingLikes = pgTable(
  'incoming_likes',
  {
    sessionId: uuid('session_id')
      .references(() => sessions.id, { onDelete: 'cascade' })
      .notNull(),
    profileId: uuid('profile_id')
      .references(() => profiles.id)
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.sessionId, table.profileId] })],
);
export const matches = pgTable(
  'matches',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionId: uuid('session_id')
      .references(() => sessions.id, { onDelete: 'cascade' })
      .notNull(),
    profileId: uuid('profile_id')
      .references(() => profiles.id)
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('unique_match').on(table.sessionId, table.profileId),
    index('session_matches').on(table.sessionId, table.createdAt),
  ],
);
