import { HttpException, Logger, type OnModuleDestroy } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { GamesService } from './games.service.js';

type GameState = Awaited<ReturnType<GamesService['getState']>>;

const room = (code: string) => `game:${code.toUpperCase()}`;

// The live channel for a game's screens: the TV and the phones watch it for updates, and phones
// send their actions (starting the game, cancelling the start, voting) over it. Lives under /api
// like the rest of the API.
@WebSocketGateway({
  path: '/api/socket.io',
  cors: { origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173' },
})
export class GamesGateway implements OnModuleDestroy {
  @WebSocketServer() private readonly server!: Server;
  private readonly logger = new Logger(GamesGateway.name);
  // Pending start countdowns by game id. If the server restarts, getState finishes them instead.
  private readonly countdowns = new Map<number, NodeJS.Timeout>();

  constructor(private readonly games: GamesService) {}

  // Start receiving updates for a game. Replies with the current state, so a screen that
  // reconnects catches up on anything it missed while it was offline.
  @SubscribeMessage('watch')
  watch(@ConnectedSocket() socket: Socket, @MessageBody() body: { code?: unknown }) {
    return reply(async () => {
      const state = await this.games.getState(requireCode(body));
      await socket.join(room(state.code));
      return { game: state };
    });
  }

  // Begins the countdown to the first question; every screen shows it and any player can cancel.
  @SubscribeMessage('start')
  start(@MessageBody() body: { code?: unknown; playerId?: unknown }) {
    return reply(async () => {
      const { state, gameId, countdownMs } = await this.games.start(requireCode(body), body.playerId);
      this.scheduleStart(gameId, countdownMs);
      this.broadcastState(state);
      return { game: state };
    });
  }

  @SubscribeMessage('cancelStart')
  cancelStart(@MessageBody() body: { code?: unknown; playerId?: unknown }) {
    return reply(async () => {
      const { state, gameId } = await this.games.cancelStart(requireCode(body), body.playerId);
      clearTimeout(this.countdowns.get(gameId));
      this.countdowns.delete(gameId);
      this.broadcastState(state);
      return { game: state };
    });
  }

  @SubscribeMessage('vote')
  vote(@MessageBody() body: { code?: unknown; playerId?: unknown; score?: unknown }) {
    return reply(async () => {
      const code = requireCode(body);
      const { vote, created } = await this.games.vote(code, body.playerId, body.score);
      // Let the TV tick off the player. Changing a vote doesn't change who has voted.
      if (created) this.broadcastState(await this.games.getState(code));
      return { vote };
    });
  }

  broadcastState(state: GameState) {
    this.server.to(room(state.code)).emit('game', state);
  }

  // When a countdown runs out, move the game to the first question and tell every screen.
  private scheduleStart(gameId: number, delayMs: number) {
    clearTimeout(this.countdowns.get(gameId));
    const timer = setTimeout(() => {
      this.countdowns.delete(gameId);
      this.games
        .finishCountdown(gameId)
        .then(async (code) => {
          if (code) this.broadcastState(await this.games.getState(code));
        })
        .catch((err: unknown) => this.logger.error(`Couldn't start game ${gameId}`, err));
    }, delayMs);
    this.countdowns.set(gameId, timer);
  }

  onModuleDestroy() {
    for (const timer of this.countdowns.values()) clearTimeout(timer);
    this.countdowns.clear();
  }
}

class MissingCode extends Error {}

function requireCode(body: { code?: unknown } | undefined): string {
  if (typeof body?.code !== 'string') throw new MissingCode('code is required');
  return body.code;
}

// Acks the result, or { error } with the reason when the request is refused (bad input, unknown
// game, game already started...), so the screen can show it. Unexpected errors still throw.
async function reply<T>(handle: () => Promise<T>): Promise<T | { error: string }> {
  try {
    return await handle();
  } catch (err) {
    if (err instanceof HttpException || err instanceof MissingCode) return { error: err.message };
    throw err;
  }
}
