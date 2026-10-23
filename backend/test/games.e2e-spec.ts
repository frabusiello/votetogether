import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { eq, inArray } from 'drizzle-orm';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { DB, type Db } from './../src/db/db.module.js';
import { games, players, votes } from './../src/db/schema.js';

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

  it('/games (POST) creates lobby games in the default category with distinct join codes', async () => {
    const first = await request(app.getHttpServer()).post('/games').expect(201);
    const second = await request(app.getHttpServer()).post('/games').expect(201);
    createdIds.push(first.body.id, second.body.id);

    for (const { body } of [first, second]) {
      expect(body).toEqual({
        id: expect.any(Number),
        code: expect.stringMatching(/^[A-HJ-NP-Z]{4}$/),
        status: 'lobby',
        category: { name: 'Foods' },
        players: [],
        question: {
          number: 1,
          total: expect.any(Number),
          item: { id: expect.any(Number), name: expect.any(String), imageUrl: null },
          votedPlayerIds: [],
        },
      });
      expect(body.question.total).toBeGreaterThan(0);
    }
    expect(first.body.code).not.toBe(second.body.code);
  });

  it('/games/:code (GET) lists the players who joined', async () => {
    const created = await request(app.getHttpServer()).post('/games').expect(201);
    createdIds.push(created.body.id);
    await db.insert(players).values([
      { gameId: created.body.id, name: 'Ana' },
      { gameId: created.body.id, name: 'Ben' },
    ]);

    const found = await request(app.getHttpServer()).get(`/games/${created.body.code}`).expect(200);
    expect(found.body.players).toEqual([
      { id: expect.any(Number), name: 'Ana' },
      { id: expect.any(Number), name: 'Ben' },
    ]);
  });

  it('/games/:code (GET) finds a game by code, case-insensitively', async () => {
    const created = await request(app.getHttpServer()).post('/games').expect(201);
    createdIds.push(created.body.id);

    const found = await request(app.getHttpServer())
      .get(`/games/${created.body.code.toLowerCase()}`)
      .expect(200);
    expect(found.body).toEqual(created.body);
  });

  describe('/games/:code/players (POST)', () => {
    let code: string;

    beforeEach(async () => {
      const created = await request(app.getHttpServer()).post('/games').expect(201);
      createdIds.push(created.body.id);
      code = created.body.code;
    });

    const join = (gameCode: string, name: unknown) =>
      request(app.getHttpServer()).post(`/games/${gameCode}/players`).send({ name });

    it('adds a trimmed player who then shows up in the game', async () => {
      const joined = await join(code.toLowerCase(), '  Ana  ').expect(201);
      expect(joined.body).toEqual({ id: expect.any(Number), name: 'Ana' });

      const found = await request(app.getHttpServer()).get(`/games/${code}`).expect(200);
      expect(found.body.players).toEqual([joined.body]);
    });

    it('rejoins as the existing player when the name is already in the game, in any case', async () => {
      const first = await join(code, 'Ana').expect(201);
      const again = await join(code, 'ana').expect(201);
      expect(again.body).toEqual(first.body);

      const found = await request(app.getHttpServer()).get(`/games/${code}`).expect(200);
      expect(found.body.players).toHaveLength(1);
    });

    it('rejects empty and overlong names', async () => {
      await join(code, '   ').expect(400);
      await join(code, 'x'.repeat(21)).expect(400);
      await join(code, undefined).expect(400);
    });

    it('returns 404 for an unknown code', async () => {
      await join('NOPE', 'Ana').expect(404);
    });

    it('turns away new players once the game has 20, but lets existing ones rejoin', async () => {
      const [{ id }] = await db.select({ id: games.id }).from(games).where(eq(games.code, code));
      await db
        .insert(players)
        .values(Array.from({ length: 20 }, (_, i) => ({ gameId: id, name: `Player ${i + 1}` })));

      const full = await join(code, 'Ana').expect(409);
      expect(full.body.message).toBe('This game is full (20 players)');
      await join(code, 'Player 7').expect(201);
    });

    it('lets existing players rejoin a started game, but not new ones', async () => {
      const ana = await join(code, 'Ana').expect(201);
      await db.update(games).set({ status: 'playing' }).where(eq(games.code, code));

      await join(code, 'Ben').expect(409);
      const again = await join(code, 'Ana').expect(201);
      expect(again.body).toEqual(ana.body);
    });
  });

  describe('/games/:code/votes (POST)', () => {
    let code: string;
    let gameId: number;
    let anaId: number;

    beforeEach(async () => {
      const created = await request(app.getHttpServer()).post('/games').expect(201);
      createdIds.push(created.body.id);
      ({ code, id: gameId } = created.body);
      const ana = await request(app.getHttpServer())
        .post(`/games/${code}/players`)
        .send({ name: 'Ana' })
        .expect(201);
      anaId = ana.body.id;
    });

    const vote = (body: object, gameCode = code) =>
      request(app.getHttpServer()).post(`/games/${gameCode}/votes`).send(body);
    const startGame = () => db.update(games).set({ status: 'playing' }).where(eq(games.id, gameId));

    it('is closed while the game is in the lobby', async () => {
      await vote({ playerId: anaId, score: 7 }).expect(409);
    });

    it('records a vote, shows who voted, and lets the player change it', async () => {
      await startGame();
      const first = await vote({ playerId: anaId, score: 7 }).expect(201);
      expect(first.body).toEqual({ itemId: expect.any(Number), score: 7 });

      const state = await request(app.getHttpServer()).get(`/games/${code}`).expect(200);
      expect(state.body.question.votedPlayerIds).toEqual([anaId]);
      expect(state.body.question.item.id).toBe(first.body.itemId);

      await vote({ playerId: anaId, score: 9 }).expect(201);
      const rows = await db.select({ score: votes.score }).from(votes).where(eq(votes.gameId, gameId));
      expect(rows).toEqual([{ score: 9 }]);
    });

    it('rejects scores outside 1–10 and missing players', async () => {
      await startGame();
      for (const score of [0, 11, 7.5, '7', undefined]) {
        await vote({ playerId: anaId, score }).expect(400);
      }
      await vote({ score: 7 }).expect(400);
    });

    it('rejects players who are not in the game', async () => {
      await startGame();
      await vote({ playerId: anaId + 100_000, score: 7 }).expect(404);
      await vote({ playerId: anaId, score: 7 }, 'NOPE').expect(404);
    });
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
