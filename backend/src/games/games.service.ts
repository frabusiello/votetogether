import { randomInt } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { and, asc, count, eq, isNotNull, isNull, lte, sql } from 'drizzle-orm';
import { DB, type Db } from '../db/db.module.js';
import { categories, gameItems, games, items, players, votes } from '../db/schema.js';

// No I or O, so codes can't be misread as 1 or 0 on the TV.
export const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
export const CODE_LENGTH = 4;
const MAX_ATTEMPTS = 5;

// Every game uses this category until players can pick one.
const DEFAULT_CATEGORY_SLUG = 'foods';

// Pressing Start counts down before the first question, so an accidental tap can be cancelled.
// Overridable so tests don't have to wait.
const startCountdownMs = () => Number(process.env.START_COUNTDOWN_MS ?? 10_000);

export const MAX_NAME_LENGTH = 20;
export const MAX_PLAYERS = 20;
// Matches the votes_score_range check in the schema.
const MIN_SCORE = 1;
const MAX_SCORE = 10;

export function generateCode(): string {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  }
  return code;
}

const isWholeNumber = (value: unknown): value is number => Number.isInteger(value);

@Injectable()
export class GamesService {
  constructor(@Inject(DB) private readonly db: Db) {}

  async create() {
    const [category] = await this.db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, DEFAULT_CATEGORY_SLUG));
    const questions = category
      ? await this.db
          .select({ id: items.id })
          .from(items)
          .where(eq(items.categoryId, category.id))
          .orderBy(asc(items.id))
      : [];
    if (!category || questions.length === 0) {
      throw new InternalServerErrorException('Default category missing, run npm run db:seed');
    }

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const code = await this.db.transaction(async (tx) => {
        // The unique index on code is what guarantees uniqueness; a clash just means try another code.
        const [game] = await tx
          .insert(games)
          .values({ code: generateCode(), categoryId: category.id })
          .onConflictDoNothing({ target: games.code })
          .returning({ id: games.id, code: games.code });
        if (!game) return null;

        await tx
          .insert(gameItems)
          .values(questions.map((item, position) => ({ gameId: game.id, itemId: item.id, position })));
        return game.code;
      });

      if (code) return this.getState(code);
    }
    throw new ServiceUnavailableException('Could not allocate a game code, try again');
  }

  // Returns the player, and whether they're new to the game (so the game changed) or rejoined.
  async join(code: string, rawName: unknown) {
    const name = typeof rawName === 'string' ? rawName.trim() : '';
    if (name.length < 1 || name.length > MAX_NAME_LENGTH) {
      throw new BadRequestException(`Name must be 1–${MAX_NAME_LENGTH} characters`);
    }

    const [game] = await this.db
      .select({ id: games.id, status: games.status, startsAt: games.startsAt })
      .from(games)
      .where(eq(games.code, code.toUpperCase()));
    if (!game) throw new NotFoundException(`No game with code ${code}`);

    // There are no accounts, so a name is the player's identity: joining with a name that's
    // already in the game (in any case) rejoins as that player, e.g. after losing the cookie.
    const findPlayer = () =>
      this.db
        .select({ id: players.id, name: players.name })
        .from(players)
        .where(and(eq(players.gameId, game.id), sql`lower(${players.name}) = lower(${name})`));

    const [existing] = await findPlayer();
    if (existing) return { player: existing, created: false };
    if (game.status !== 'lobby') throw new ConflictException('This game has already started');
    if (game.startsAt) throw new ConflictException('This game is about to start');

    // Two joins at the same moment could squeeze in a 21st player; that's fine for a party game.
    const [{ playerCount }] = await this.db
      .select({ playerCount: count() })
      .from(players)
      .where(eq(players.gameId, game.id));
    if (playerCount >= MAX_PLAYERS) {
      throw new ConflictException(`This game is full (${MAX_PLAYERS} players)`);
    }

    const [created] = await this.db
      .insert(players)
      .values({ gameId: game.id, name })
      .onConflictDoNothing({ target: [players.gameId, players.name] })
      .returning({ id: players.id, name: players.name });
    if (created) return { player: created, created: true };
    // Someone else took the name between the lookup and the insert: they're the same player.
    return { player: (await findPlayer())[0], created: false };
  }

  async getState(code: string) {
    const loadGame = async () => {
      const [row] = await this.db
        .select({
          id: games.id,
          code: games.code,
          status: games.status,
          categoryId: games.categoryId,
          currentItemIndex: games.currentItemIndex,
          startsAt: games.startsAt,
        })
        .from(games)
        .where(eq(games.code, code.toUpperCase()));
      if (!row) throw new NotFoundException(`No game with code ${code}`);
      return row;
    };

    let game = await loadGame();
    // A countdown whose timer was lost (e.g. the server restarted) finishes the next time it's read.
    if (game.status === 'lobby' && game.startsAt && game.startsAt <= new Date()) {
      await this.finishCountdown(game.id);
      game = await loadGame();
    }

    const [[category], gamePlayers, [currentItem], [{ total }]] = await Promise.all([
      game.categoryId === null
        ? Promise.resolve([])
        : this.db
            .select({ name: categories.name })
            .from(categories)
            .where(eq(categories.id, game.categoryId)),
      this.db
        .select({ id: players.id, name: players.name })
        .from(players)
        .where(eq(players.gameId, game.id))
        .orderBy(asc(players.joinedAt), asc(players.id)),
      this.db
        .select({ id: items.id, name: items.name, imageUrl: items.imageUrl })
        .from(gameItems)
        .innerJoin(items, eq(items.id, gameItems.itemId))
        .where(and(eq(gameItems.gameId, game.id), eq(gameItems.position, game.currentItemIndex))),
      this.db.select({ total: count() }).from(gameItems).where(eq(gameItems.gameId, game.id)),
    ]);

    // Who has voted on the current question, but not how, so scores stay hidden until results.
    const voters = currentItem
      ? await this.db
          .select({ playerId: votes.playerId })
          .from(votes)
          .where(and(eq(votes.gameId, game.id), eq(votes.itemId, currentItem.id)))
      : [];

    return {
      id: game.id,
      code: game.code,
      status: game.status,
      category: category ?? null,
      // Time left before the first question while the lobby counts down. Sent as a duration rather
      // than a timestamp so it doesn't depend on each phone's clock being right.
      startingInMs: game.startsAt ? Math.max(0, game.startsAt.getTime() - Date.now()) : null,
      players: gamePlayers,
      question: currentItem
        ? {
            number: game.currentItemIndex + 1,
            total,
            item: currentItem,
            votedPlayerIds: voters.map((v) => v.playerId),
          }
        : null,
    };
  }

  // Any player in the game can press Start in the lobby. That closes joining and begins a countdown;
  // the caller schedules finishCountdown for when it runs out. Returns the state, the game's id
  // and how long the countdown is.
  async start(code: string, playerId: unknown) {
    const game = await this.findGameForPlayer(code, playerId);
    if (game.status !== 'lobby') throw new ConflictException('This game has already started');

    const countdownMs = startCountdownMs();
    // Only a lobby that isn't already counting down, so two players pressing Start at once is fine.
    const started = await this.db
      .update(games)
      .set({ startsAt: new Date(Date.now() + countdownMs) })
      .where(and(eq(games.id, game.id), eq(games.status, 'lobby'), isNull(games.startsAt)))
      .returning({ id: games.id });
    if (started.length === 0) throw new ConflictException('This game is already starting');

    return { state: await this.getState(code), gameId: game.id, countdownMs };
  }

  // Any player in the game can stop the countdown, which reopens the lobby.
  async cancelStart(code: string, playerId: unknown) {
    const game = await this.findGameForPlayer(code, playerId);

    const cancelled = await this.db
      .update(games)
      .set({ startsAt: null })
      .where(and(eq(games.id, game.id), eq(games.status, 'lobby'), isNotNull(games.startsAt)))
      .returning({ id: games.id });
    if (cancelled.length === 0) {
      throw new ConflictException(
        game.status === 'lobby' ? "The game isn't starting" : 'This game has already started',
      );
    }

    return { state: await this.getState(code), gameId: game.id };
  }

  // Moves a lobby whose countdown has run out on to the first question. Returns the game's code,
  // or null if there was nothing to do (the countdown was cancelled or already finished).
  async finishCountdown(gameId: number) {
    const [game] = await this.db
      .update(games)
      .set({ status: 'playing', currentItemIndex: 0, startsAt: null })
      .where(
        and(
          eq(games.id, gameId),
          eq(games.status, 'lobby'),
          // A little slack so a timer that fires right on time isn't a hair too early for the DB.
          lte(games.startsAt, new Date(Date.now() + 50)),
        ),
      )
      .returning({ code: games.code });
    return game?.code ?? null;
  }

  private async findGameForPlayer(code: string, playerId: unknown) {
    if (!isWholeNumber(playerId)) throw new BadRequestException('playerId is required');

    const [game] = await this.db
      .select({ id: games.id, status: games.status })
      .from(games)
      .where(eq(games.code, code.toUpperCase()));
    if (!game) throw new NotFoundException(`No game with code ${code}`);

    const [player] = await this.db
      .select({ id: players.id })
      .from(players)
      .where(and(eq(players.id, playerId), eq(players.gameId, game.id)));
    if (!player) throw new NotFoundException("You're not in this game");
    return game;
  }

  // Records a player's 1–10 score for the game's current question. Voting again changes the score.
  // Returns the vote, and whether it's the player's first on this question.
  async vote(code: string, playerId: unknown, score: unknown) {
    if (!isWholeNumber(playerId)) throw new BadRequestException('playerId is required');
    if (!isWholeNumber(score) || score < MIN_SCORE || score > MAX_SCORE) {
      throw new BadRequestException(`Score must be a whole number from ${MIN_SCORE} to ${MAX_SCORE}`);
    }

    const [game] = await this.db
      .select({ id: games.id, status: games.status, currentItemIndex: games.currentItemIndex })
      .from(games)
      .where(eq(games.code, code.toUpperCase()));
    if (!game) throw new NotFoundException(`No game with code ${code}`);
    if (game.status !== 'playing') throw new ConflictException("Voting isn't open right now");

    const [[player], [current]] = await Promise.all([
      this.db
        .select({ id: players.id })
        .from(players)
        .where(and(eq(players.id, playerId), eq(players.gameId, game.id))),
      this.db
        .select({ itemId: gameItems.itemId })
        .from(gameItems)
        .where(and(eq(gameItems.gameId, game.id), eq(gameItems.position, game.currentItemIndex))),
    ]);
    if (!player) throw new NotFoundException("You're not in this game");
    if (!current) throw new ConflictException('There is no question to vote on');

    const [{ created, ...vote }] = await this.db
      .insert(votes)
      .values({ gameId: game.id, playerId, itemId: current.itemId, score })
      .onConflictDoUpdate({ target: [votes.playerId, votes.itemId], set: { score } })
      // Postgres sets xmax to 0 on a fresh insert and non-zero when the upsert updated a row.
      .returning({ itemId: votes.itemId, score: votes.score, created: sql<boolean>`xmax = 0` });
    // Whether this is the player's first vote on the question (so who has voted changed).
    return { vote, created };
  }
}
