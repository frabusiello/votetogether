import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { inArray } from 'drizzle-orm';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { DB, type Db } from './../src/db/db.module.js';
import { games } from './../src/db/schema.js';

describe('GamesController (e2e)', () => {
  let app: INestApplication<App>;
  let db: Db;
  const createdIds: number[] = [];

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    db = app.get(DB);
  });

  it('/games (POST) creates games with distinct join codes', async () => {
    const first = await request(app.getHttpServer()).post('/games').expect(201);
    const second = await request(app.getHttpServer()).post('/games').expect(201);
    createdIds.push(first.body.id, second.body.id);

    for (const { body } of [first, second]) {
      expect(body).toEqual({
        id: expect.any(Number),
        code: expect.stringMatching(/^[A-HJ-NP-Z]{4}$/),
        status: 'lobby',
      });
    }
    expect(first.body.code).not.toBe(second.body.code);
  });

  it('/games/:code (GET) finds a game by code, case-insensitively', async () => {
    const created = await request(app.getHttpServer()).post('/games').expect(201);
    createdIds.push(created.body.id);

    const found = await request(app.getHttpServer())
      .get(`/games/${created.body.code.toLowerCase()}`)
      .expect(200);
    expect(found.body).toEqual(created.body);
  });

  it('/games/:code (GET) returns 404 for an unknown code', () => {
    // Contains an O, so it can never be generated.
    return request(app.getHttpServer()).get('/games/NOPE').expect(404);
  });

  afterEach(async () => {
    if (createdIds.length) {
      await db.delete(games).where(inArray(games.id, createdIds.splice(0)));
    }
    await app.close();
  });
});
