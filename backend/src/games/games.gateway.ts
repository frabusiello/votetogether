import { NotFoundException } from '@nestjs/common';
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

// Pushes game updates to the screens watching a game. Lives under /api like the rest of the API.
@WebSocketGateway({
  path: '/api/socket.io',
  cors: { origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173' },
})
export class GamesGateway {
  @WebSocketServer() private readonly server!: Server;

  constructor(private readonly games: GamesService) {}

  // Start receiving updates for a game. Replies with the current state, so a screen that
  // reconnects catches up on anything it missed while it was offline.
  @SubscribeMessage('watch')
  async watch(@ConnectedSocket() socket: Socket, @MessageBody() body: { code?: unknown }) {
    if (typeof body?.code !== 'string') return { error: 'code is required' };
    try {
      const state = await this.games.getState(body.code);
      await socket.join(room(state.code));
      return { game: state };
    } catch (err) {
      if (err instanceof NotFoundException) return { error: err.message };
      throw err;
    }
  }

  broadcastState(state: GameState) {
    this.server.to(room(state.code)).emit('game', state);
  }
}
