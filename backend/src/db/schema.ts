import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  smallint,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core';

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
});

export const items = pgTable(
  'items',
  {
    id: serial('id').primaryKey(),
    categoryId: integer('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    imageUrl: text('image_url'),
  },
  (t) => [index('items_category_id_idx').on(t.categoryId)],
);

export const gameStatus = pgEnum('game_status', ['lobby', 'playing', 'results']);

export const games = pgTable('games', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  categoryId: integer('category_id').references(() => categories.id, {
    onDelete: 'set null',
  }),
  status: gameStatus('status').notNull().default('lobby'),
  currentItemIndex: integer('current_item_index').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// The ordered list of questions picked for a particular game.
export const gameItems = pgTable(
  'game_items',
  {
    gameId: integer('game_id')
      .notNull()
      .references(() => games.id, { onDelete: 'cascade' }),
    itemId: integer('item_id')
      .notNull()
      .references(() => items.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.gameId, t.itemId] }),
    unique('game_items_game_position_uq').on(t.gameId, t.position),
  ],
);

export const players = pgTable(
  'players',
  {
    id: serial('id').primaryKey(),
    gameId: integer('game_id')
      .notNull()
      .references(() => games.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique('players_game_name_uq').on(t.gameId, t.name)],
);

export const votes = pgTable(
  'votes',
  {
    id: serial('id').primaryKey(),
    gameId: integer('game_id')
      .notNull()
      .references(() => games.id, { onDelete: 'cascade' }),
    playerId: integer('player_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    itemId: integer('item_id')
      .notNull()
      .references(() => items.id, { onDelete: 'cascade' }),
    score: smallint('score').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique('votes_player_item_uq').on(t.playerId, t.itemId),
    index('votes_game_item_idx').on(t.gameId, t.itemId),
    check('votes_score_range', sql`${t.score} between 1 and 10`),
  ],
);

export type Category = typeof categories.$inferSelect;
export type Item = typeof items.$inferSelect;
export type Game = typeof games.$inferSelect;
export type Player = typeof players.$inferSelect;
export type Vote = typeof votes.$inferSelect;
