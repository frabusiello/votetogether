import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { io, type Socket } from 'socket.io-client';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { DB, type Db } from './../src/db/db.module.js';
import { games, votes } from './../src/db/schema.js';

// Short countdowns so the start tests don't wait the real 10 seconds.
const COUNTDOWN_MS = 300;
process.env.START_COUNTDOWN_MS = String(COUNTDOWN_MS);

type GameState = {
  code: string;
  status: string;
  startingInMs: number | null;
  players: { id: number; name: string }[];
  question: { number: number; votedPlayerIds: number[] } | null;
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

  describe('start', () => {
    type Ack = { game?: GameState; error?: string };
    const start = (playerId: unknown) => socket.emitWithAck('start', { code, playerId }) as Promise<Ack>;
    const cancel = (playerId: unknown) =>
      socket.emitWithAck('cancelStart', { code, playerId }) as Promise<Ack>;
    let anaId: number;
    let benId: number;

    beforeEach(async () => {
      anaId = (await join('Ana')).body.id;
      benId = (await join('Ben')).body.id;
      await watch(code);
    });

    it('counts down, closes joining, then moves everyone to the first question', async () => {
      expect(await start(anaId + 100_000)).toEqual({ error: "You're not in this game" });

      const countdown = nextUpdate();
      const started = await start(anaId);
      expect(started.game).toMatchObject({ status: 'lobby', startingInMs: expect.any(Number) });
      expect(started.game?.startingInMs).toBeGreaterThan(0);
      expect((await countdown).startingInMs).toEqual(expect.any(Number));

      expect(await start(benId)).toEqual({ error: 'This game is already starting' });
      const late = await request(app.getHttpServer())
        .post(`/games/${code}/players`)
        .send({ name: 'Chiara' })
        .expect(409);
      expect(late.body.message).toBe('This game is about to start');
      await join('ana'); // Players already in can still rejoin.

      const playing = await nextUpdate();
      expect(playing).toMatchObject({ status: 'playing', startingInMs: null, question: { number: 1 } });
      expect(await start(anaId)).toEqual({ error: 'This game has already started' });
    });

    it('lets any player cancel the countdown, which reopens the lobby', async () => {
      expect(await cancel(benId)).toEqual({ error: "The game isn't starting" });
      await start(anaId);

      const update = nextUpdate();
      const cancelled = await cancel(benId);
      expect(cancelled.game).toMatchObject({ status: 'lobby', startingInMs: null });
      expect(await update).toEqual(cancelled.game);

      // The countdown's timer was cleared, so nothing more arrives and joining is open again.
      const onGame = vi.fn();
      socket.on('game', onGame);
      await new Promise((resolve) => setTimeout(resolve, COUNTDOWN_MS + 200));
      expect(onGame).not.toHaveBeenCalled();
      await join('Chiara');
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
    // Starts the game and waits out the countdown.
    const start = async () => {
      const playing = new Promise<void>((resolve) => {
        const onGame = (game: GameState) => {
          if (game.status !== 'playing') return;
          socket.off('game', onGame);
          resolve();
        };
        socket.on('game', onGame);
      });
      await socket.emitWithAck('start', { code, playerId: anaId });
      await playing;
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
