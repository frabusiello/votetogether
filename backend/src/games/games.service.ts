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
import { and, asc, count, eq, sql } from 'drizzle-orm';
import { DB, type Db } from '../db/db.module.js';
import { categories, gameItems, games, items, players, votes } from '../db/schema.js';

// No I or O, so codes can't be misread as 1 or 0 on the TV.
export const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
export const CODE_LENGTH = 4;
const MAX_ATTEMPTS = 5;

// Every game uses this category until players can pick one.
const DEFAULT_CATEGORY_SLUG = 'foods';

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

export const isWholeNumber = (value: unknown): value is number => Number.isInteger(value);

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
  // `startingSoon` closes the game to new players while the lobby counts down to the start.
  async join(code: string, rawName: unknown, { startingSoon = false } = {}) {
    const name = typeof rawName === 'string' ? rawName.trim() : '';
    if (name.length < 1 || name.length > MAX_NAME_LENGTH) {
      throw new BadRequestException(`Name must be 1–${MAX_NAME_LENGTH} characters`);
    }

    const [game] = await this.db
      .select({ id: games.id, status: games.status })
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
    if (startingSoon) throw new ConflictException('This game is about to start');

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
    const [game] = await this.db
      .select({
        id: games.id,
        code: games.code,
        status: games.status,
        categoryId: games.categoryId,
        currentItemIndex: games.currentItemIndex,
      })
      .from(games)
      .where(eq(games.code, code.toUpperCase()));
    if (!game) throw new NotFoundException(`No game with code ${code}`);

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

    const questionVotes = currentItem
      ? await this.db
          .select({ playerId: votes.playerId, score: votes.score })
          .from(votes)
          .where(and(eq(votes.gameId, game.id), eq(votes.itemId, currentItem.id)))
          .orderBy(asc(votes.createdAt), asc(votes.id))
      : [];

    return {
      id: game.id,
      code: game.code,
      status: game.status,
      category: category ?? null,
      players: gamePlayers,
      // While playing, the question being voted on; in the results, the question whose votes are
      // showing. Results go in question order for now: this is the place to sort them later (e.g.
      // most agreed-on first).
      question: currentItem
        ? {
            number: game.currentItemIndex + 1,
            total,
            item: currentItem,
            // Who has voted, but not how: scores stay hidden until the results.
            votedPlayerIds: questionVotes.map((v) => v.playerId),
            votes: game.status === 'results' ? questionVotes : null,
          }
        : null,
    };
  }

  // Checks that a player can press Start: they're in the game and it's still in the lobby. The
  // countdown itself runs on the screens; begin() moves the game on when it runs out.
  async checkCanStart(code: string, playerId: unknown) {
    const game = await this.findGameForPlayer(code, playerId);
    if (game.status !== 'lobby') throw new ConflictException('This game has already started');
    return game;
  }

  // Moves a lobby on to the first question. Returns the new state, or null if the game had already
  // begun, so several screens finishing the countdown at once is fine.
  async begin(code: string) {
    const begun = await this.db
      .update(games)
      .set({ status: 'playing', currentItemIndex: 0 })
      .where(and(eq(games.code, code.toUpperCase()), eq(games.status, 'lobby')))
      .returning({ id: games.id });
    return begun.length > 0 ? this.getState(code) : null;
  }

  // Moves on from question `fromNumber` (1-based) to the next one, or to the results after the last.
  // Returns the new state, or null if the game is no longer on that question (someone else already
  // moved it on).
  async advance(code: string, fromNumber: unknown) {
    if (!isWholeNumber(fromNumber)) throw new BadRequestException('questionNumber is required');

    const [game] = await this.db
      .select({ id: games.id })
      .from(games)
      .where(eq(games.code, code.toUpperCase()));
    if (!game) throw new NotFoundException(`No game with code ${code}`);
    const [{ total }] = await this.db
      .select({ total: count() })
      .from(gameItems)
      .where(eq(gameItems.gameId, game.id));

    // After the last question the results start again from question 1.
    const next: Partial<typeof games.$inferInsert> =
      fromNumber < total
        ? { currentItemIndex: fromNumber }
        : { status: 'results', currentItemIndex: 0 };
    const advanced = await this.db
      .update(games)
      .set(next)
      .where(
        and(
          eq(games.id, game.id),
          eq(games.status, 'playing'),
          eq(games.currentItemIndex, fromNumber - 1),
        ),
      )
      .returning({ id: games.id });
    return advanced.length > 0 ? this.getState(code) : null;
  }

  // In the results, moves on from question `fromNumber`'s results to the next question's. Returns
  // the new state, or null if there's nothing to do: the results already moved on, or that was the
  // last question.
  async nextResult(code: string, fromNumber: number) {
    const [game] = await this.db
      .select({ id: games.id })
      .from(games)
      .where(eq(games.code, code.toUpperCase()));
    if (!game) throw new NotFoundException(`No game with code ${code}`);
    const [{ total }] = await this.db
      .select({ total: count() })
      .from(gameItems)
      .where(eq(gameItems.gameId, game.id));
    if (fromNumber >= total) return null;

    const moved = await this.db
      .update(games)
      .set({ currentItemIndex: fromNumber })
      .where(
        and(
          eq(games.id, game.id),
          eq(games.status, 'results'),
          eq(games.currentItemIndex, fromNumber - 1),
        ),
      )
      .returning({ id: games.id });
    return moved.length > 0 ? this.getState(code) : null;
  }

  // Throws unless `playerId` is a player in the game.
  async findGameForPlayer(code: string, playerId: unknown) {
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
