import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { io, type Socket } from 'socket.io-client';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { DB, type Db } from './../src/db/db.module.js';
import { games, votes } from './../src/db/schema.js';

type GameState = {
  code: string;
  status: string;
  startingInMs: number | null;
  players: { id: number; name: string }[];
  question: { number: number; total: number; votedPlayerIds: number[] } | null;
};

describe('GamesGateway (e2e)', () => {
  let app: INestApplication<App>;
  let db: Db;
  let socket: Socket;
  let code: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.listen(0);
    db = app.get(DB);

    const created = await request(app.getHttpServer()).post('/games').expect(201);
    code = created.body.code;

    socket = io(await app.getUrl(), { path: '/api/socket.io', transports: ['websocket'] });
  });

  afterEach(async () => {
    socket.disconnect();
    await db.delete(games).where(eq(games.code, code));
    await app.close();
  });

  const watch = (gameCode: string) =>
    socket.emitWithAck('watch', { code: gameCode }) as Promise<{ game?: GameState; error?: string }>;
  const nextUpdate = () => new Promise<GameState>((resolve) => socket.once('game', resolve));
  const join = (name: string) =>
    request(app.getHttpServer()).post(`/games/${code}/players`).send({ name }).expect(201);

  it('replies to watch with the current game, or an error for an unknown code', async () => {
    const reply = await watch(code.toLowerCase());
    expect(reply.game).toMatchObject({ code, players: [] });

    expect(await watch('NOPE')).toEqual({ error: 'No game with code NOPE' });
  });

  it('pushes the updated game to watchers when a new player joins, but not on a rejoin', async () => {
    await watch(code);

    const update = nextUpdate();
    await join('Ana');
    expect((await update).players.map((p) => p.name)).toEqual(['Ana']);

    const onGame = vi.fn();
    socket.on('game', onGame);
    await join('ana');
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(onGame).not.toHaveBeenCalled();
  });

  type Ack = { game?: GameState | null; error?: string };
  const send = (event: string, payload: object) =>
    socket.emitWithAck(event, { code, ...payload }) as Promise<Ack>;

  describe('start, cancelStart and begin', () => {
    let anaId: number;
    let benId: number;

    beforeEach(async () => {
      anaId = (await join('Ana')).body.id;
      benId = (await join('Ben')).body.id;
      await watch(code);
    });

    it('starts a countdown on every screen and closes joining, then begin moves to question 1', async () => {
      expect(await send('start', { playerId: anaId + 100_000 })).toEqual({
        error: "You're not in this game",
      });
      // Nothing to begin before anyone presses Start.
      expect(await send('begin', {})).toEqual({ game: null });

      const countdown = nextUpdate();
      const started = await send('start', { playerId: anaId });
      expect(started.game).toMatchObject({ status: 'lobby', startingInMs: expect.any(Number) });
      expect(started.game?.startingInMs).toBeGreaterThan(0);
      expect((await countdown).startingInMs).toEqual(expect.any(Number));
      expect((await watch(code)).game?.startingInMs).toEqual(expect.any(Number));

      expect(await send('start', { playerId: benId })).toEqual({
        error: 'This game is already starting',
      });
      const late = await request(app.getHttpServer())
        .post(`/games/${code}/players`)
        .send({ name: 'Chiara' })
        .expect(409);
      expect(late.body.message).toBe('This game is about to start');
      await join('ana'); // Players already in can still rejoin.

      const playing = nextUpdate();
      const begun = await send('begin', {});
      expect(begun.game).toMatchObject({ status: 'playing', startingInMs: null, question: { number: 1 } });
      expect(await playing).toEqual(begun.game);

      // Other screens finishing their countdown a moment later change nothing.
      expect(await send('begin', {})).toEqual({ game: null });
      expect(await send('start', { playerId: anaId })).toEqual({
        error: 'This game has already started',
      });
    });

    it('lets any player cancel the countdown, which reopens the lobby', async () => {
      expect(await send('cancelStart', { playerId: benId })).toEqual({
        error: "The game isn't starting",
      });
      await send('start', { playerId: anaId });

      const update = nextUpdate();
      const cancelled = await send('cancelStart', { playerId: benId });
      expect(cancelled.game).toMatchObject({ status: 'lobby', startingInMs: null });
      expect(await update).toEqual(cancelled.game);

      // A screen whose countdown still ran out doesn't start the game, and joining is open again.
      expect(await send('begin', {})).toEqual({ game: null });
      await join('Chiara');
    });
  });

  describe('next', () => {
    let anaId: number;

    beforeEach(async () => {
      anaId = (await join('Ana')).body.id;
      await watch(code);
      await send('start', { playerId: anaId });
      await send('begin', {});
    });

    it('moves on to the next question once, however many times it is sent', async () => {
      await send('vote', { playerId: anaId, score: 7 });

      const update = nextUpdate();
      const next = await send('next', { questionNumber: 1 });
      expect(next.game).toMatchObject({ status: 'playing', question: { number: 2, votedPlayerIds: [] } });
      expect(await update).toEqual(next.game);

      expect(await send('next', { questionNumber: 1 })).toEqual({ game: null });
      expect(await send('next', {})).toEqual({ error: 'questionNumber is required' });
    });

    it('goes to the results after the last question', async () => {
      const total = (await watch(code)).game?.question?.total ?? 0;
      await db.update(games).set({ currentItemIndex: total - 1 }).where(eq(games.code, code));

      const results = await send('next', { questionNumber: total });
      expect(results.game).toMatchObject({ status: 'results' });
    });
  });

  describe('vote', () => {
    let anaId: number;

    beforeEach(async () => {
      anaId = (await join('Ana')).body.id;
      await watch(code);
    });

    const vote = (score: unknown, playerId: unknown = anaId) =>
      socket.emitWithAck('vote', { code, playerId, score }) as Promise<{
        vote?: { itemId: number; score: number };
        error?: string;
      }>;
    // Starts the game, as a screen does when its countdown runs out.
    const start = async () => {
      await send('start', { playerId: anaId });
      await send('begin', {});
    };

    it('is closed while the game is in the lobby', async () => {
      expect(await vote(7)).toEqual({ error: "Voting isn't open right now" });
    });

    it('pushes the updated game on a first vote, but not when the vote changes', async () => {
      await start();

      const update = nextUpdate();
      expect(await vote(7)).toEqual({ vote: { itemId: expect.any(Number), score: 7 } });
      expect((await update).question?.votedPlayerIds).toEqual([anaId]);

      const onGame = vi.fn();
      socket.on('game', onGame);
      expect((await vote(9)).vote?.score).toBe(9);
      await new Promise((resolve) => setTimeout(resolve, 200));
      expect(onGame).not.toHaveBeenCalled();

      const [game] = await db.select({ id: games.id }).from(games).where(eq(games.code, code));
      const rows = await db.select({ score: votes.score }).from(votes).where(eq(votes.gameId, game.id));
      expect(rows).toEqual([{ score: 9 }]);
    });

    it('rejects scores outside 1–10 and players who are not in the game', async () => {
      await start();
      for (const score of [0, 11, 7.5, '7', undefined]) {
        expect((await vote(score)).error).toBe('Score must be a whole number from 1 to 10');
      }
      expect(await vote(7, anaId + 100_000)).toEqual({ error: "You're not in this game" });
    });
  });
});
