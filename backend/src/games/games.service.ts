import { randomInt } from 'node:crypto';
import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { and, asc, count, eq } from 'drizzle-orm';
import { DB, type Db } from '../db/db.module.js';
import { categories, gameItems, games, items, players } from '../db/schema.js';

// No I or O, so codes can't be misread as 1 or 0 on the TV.
export const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
export const CODE_LENGTH = 4;
const MAX_ATTEMPTS = 5;

// Every game uses this category until players can pick one.
const DEFAULT_CATEGORY_SLUG = 'foods';

export function generateCode(): string {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  }
  return code;
}

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

    return {
      id: game.id,
      code: game.code,
      status: game.status,
      category: category ?? null,
      players: gamePlayers,
      question: currentItem
        ? { number: game.currentItemIndex + 1, total, item: currentItem }
        : null,
    };
  }
}
