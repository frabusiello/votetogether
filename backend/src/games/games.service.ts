import { randomInt } from 'node:crypto';
import { Inject, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { DB, type Db } from '../db/db.module.js';
import { games } from '../db/schema.js';

// No I or O, so codes can't be misread as 1 or 0 on the TV.
export const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
export const CODE_LENGTH = 4;
const MAX_ATTEMPTS = 5;

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
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      // The unique index on code is what guarantees uniqueness; a clash just means try another code.
      const [game] = await this.db
        .insert(games)
        .values({ code: generateCode() })
        .onConflictDoNothing({ target: games.code })
        .returning({ id: games.id, code: games.code, status: games.status });

      if (game) return game;
    }
    throw new ServiceUnavailableException('Could not allocate a game code, try again');
  }
}
