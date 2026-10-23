import { ConflictException, HttpException } from '@nestjs/common';
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

// Pressing Start counts down this long on every screen before the first question, so an accidental
// tap can be cancelled.
const START_COUNTDOWN_MS = 10_000;

const room = (code: string) => `game:${code.toUpperCase()}`;

// The live channel for a game's screens: the TV and the phones watch it for updates and send their
// actions over it (starting and cancelling the start, beginning the game, voting, moving to the
// next question). Lives under /api like the rest of the API.
//
// Countdowns run on the screens, which send `begin` or `next` when theirs reaches zero. The server
// only remembers, in memory, which lobbies are counting down to the start, so it can keep joining
// closed and tell a screen that reconnects how long is left.
@WebSocketGateway({
  path: '/api/socket.io',
  cors: { origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173' },
})
export class GamesGateway {
  @WebSocketServer() private readonly server!: Server;
  // Lobbies counting down to the start: game code to when the countdown ends (ms since epoch).
  private readonly startingSoon = new Map<string, number>();

  constructor(private readonly games: GamesService) {}

  isStartingSoon(code: string) {
    return this.startingSoon.has(code.toUpperCase());
  }

  // Start receiving updates for a game. Replies with the current state, so a screen that
  // reconnects catches up on anything it missed while it was offline.
  @SubscribeMessage('watch')
  watch(@ConnectedSocket() socket: Socket, @MessageBody() body: { code?: unknown }) {
    return reply(async () => {
      const state = await this.games.getState(requireCode(body));
      await socket.join(room(state.code));
      return { game: this.withCountdown(state) };
    });
  }

  // Any player can press Start in the lobby: every screen counts down, and joining closes.
  @SubscribeMessage('start')
  start(@MessageBody() body: { code?: unknown; playerId?: unknown }) {
    return reply(async () => {
      const code = requireCode(body).toUpperCase();
      await this.games.checkCanStart(code, body.playerId);
      if (this.startingSoon.has(code)) throw new ConflictException('This game is already starting');
      this.startingSoon.set(code, Date.now() + START_COUNTDOWN_MS);
      return { game: await this.broadcast(code) };
    });
  }

  // Any player can stop the start countdown, which reopens the lobby.
  @SubscribeMessage('cancelStart')
  cancelStart(@MessageBody() body: { code?: unknown; playerId?: unknown }) {
    return reply(async () => {
      const code = requireCode(body).toUpperCase();
      await this.games.findGameForPlayer(code, body.playerId);
      if (!this.startingSoon.delete(code)) throw new ConflictException("The game isn't starting");
      return { game: await this.broadcast(code) };
    });
  }

  // Sent by the screens when the start countdown reaches zero. Only the first one counts; the rest
  // (and any after a cancel) get { game: null }.
  @SubscribeMessage('begin')
  begin(@MessageBody() body: { code?: unknown }) {
    return reply(async () => {
      const code = requireCode(body).toUpperCase();
      if (!this.startingSoon.delete(code)) return { game: null };
      const state = await this.games.begin(code);
      if (state) this.broadcastState(state);
      return { game: state && this.withCountdown(state) };
    });
  }

  // Sent by the TV when the countdown after everyone has voted reaches zero: moves on to the next
  // question, or to the results after the last one. A repeated or stale `next` changes nothing.
  @SubscribeMessage('next')
  next(@MessageBody() body: { code?: unknown; questionNumber?: unknown }) {
    return reply(async () => {
      const state = await this.games.advance(requireCode(body), body.questionNumber);
      if (state) this.broadcastState(state);
      return { game: state && this.withCountdown(state) };
    });
  }

  @SubscribeMessage('vote')
  vote(@MessageBody() body: { code?: unknown; playerId?: unknown; score?: unknown }) {
    return reply(async () => {
      const code = requireCode(body);
      const { vote, created } = await this.games.vote(code, body.playerId, body.score);
      // Let the TV tick off the player. Changing a vote doesn't change who has voted.
      if (created) await this.broadcast(code);
      return { vote };
    });
  }

  broadcastState(state: GameState) {
    this.server.to(room(state.code)).emit('game', this.withCountdown(state));
  }

  private async broadcast(code: string) {
    const state = await this.games.getState(code);
    this.broadcastState(state);
    return this.withCountdown(state);
  }

  // Adds how long is left on the start countdown, if one is running. A duration rather than a
  // clock time, so it doesn't depend on each phone's clock being right.
  private withCountdown(state: GameState) {
    const endsAt = this.startingSoon.get(state.code);
    return { ...state, startingInMs: endsAt === undefined ? null : Math.max(0, endsAt - Date.now()) };
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
