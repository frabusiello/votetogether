import { Inject, Injectable } from '@nestjs/common';
import { DB, type Db } from '../db/db.module.js';
import { count, eq } from 'drizzle-orm';
import {
  gameItems,
  games,
  items,
  players,
  quizzes,
  votes,
} from '../db/schema.js';

@Injectable()
export class QuizzesService {
  constructor(@Inject(DB) private readonly db: Db) {}

  async getAll() {
    const quizList = await this.db
      .select({
        id: quizzes.id,
        name: quizzes.name,
        numQuestions: count(items.id),
      })
      .from(quizzes)
      .innerJoin(items, eq(items.quizId, quizzes.id))
      .groupBy(quizzes.id)
      .orderBy(quizzes.name);
    return quizList;
  }
}
