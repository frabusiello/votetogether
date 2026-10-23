import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { io, type Socket } from 'socket.io-client';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { DB, type Db } from './../src/db/db.module.js';
import { games } from './../src/db/schema.js';

type GameState = { code: string; players: { id: number; name: string }[] };

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
});
