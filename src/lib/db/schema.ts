import { pgTable, uuid, text, integer, timestamp, primaryKey, uniqueIndex, index, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(), name: text('name').notNull(), age: integer('age').notNull(),
  city: text('city').notNull(), bio: text('bio').notNull(), interests: text('interests').array().notNull(),
  photoUrl: text('photo_url').notNull(), sortOrder: integer('sort_order').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, t => [check('adult_profiles', sql`${t.age} >= 18`)]);

export const sessions = pgTable('demo_sessions', {
  id: uuid('id').primaryKey().defaultRandom(), createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
export const swipes = pgTable('swipes', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').references(() => sessions.id, { onDelete: 'cascade' }).notNull(),
  profileId: uuid('profile_id').references(() => profiles.id).notNull(),
  action: text('action', { enum: ['like', 'pass'] }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, t => [uniqueIndex('unique_swipe').on(t.sessionId, t.profileId), check('valid_action', sql`${t.action} IN ('like', 'pass')`)]);
export const incomingLikes = pgTable('incoming_likes', {
  sessionId: uuid('session_id').references(() => sessions.id, { onDelete: 'cascade' }).notNull(),
  profileId: uuid('profile_id').references(() => profiles.id).notNull(),
}, t => [primaryKey({ columns: [t.sessionId, t.profileId] })]);
export const matches = pgTable('matches', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').references(() => sessions.id, { onDelete: 'cascade' }).notNull(),
  profileId: uuid('profile_id').references(() => profiles.id).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, t => [uniqueIndex('unique_match').on(t.sessionId, t.profileId), index('session_matches').on(t.sessionId, t.createdAt)]);
