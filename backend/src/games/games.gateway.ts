import {
  BadRequestException,
  ConflictException,
  HttpException,
  Logger,
  NotFoundException,
  type OnModuleDestroy,
} from '@nestjs/common'
import {
  ConnectedSocket,
  MessageBody,
  type OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets'
import type { Server, Socket } from 'socket.io'
import { GamesService, isWholeNumber } from './games.service.js'

type GameState = Awaited<ReturnType<GamesService['getState']>>

// What a socket is watching: the game, and the player when it's a phone (null for the TV).
type Watching = { code: string; playerId: number | null }

// Pressing Start counts down this long on every screen before the first question, so an accidental
// tap can be cancelled.
const START_COUNTDOWN_MS = 10_000

const room = (code: string) => `game:${code.toUpperCase()}`

// The live channel for a game's screens: the TV and the phones watch it for updates and send their
// actions over it (starting and cancelling the start, beginning the game, voting, moving to the
// next question, moving through the results, going back to the lobby). Lives under /api like the
// rest of the API.
//
// Countdowns run on the screens, which send `begin` or `next` when theirs reaches zero; the server
// runs no timers. It only keeps a little live state in memory: which lobbies are counting down to
// the start (so joining stays closed), which players are connected, and who has tapped Next on the
// results.
@WebSocketGateway({
  path: '/api/socket.io',
  cors: { origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173' },
})
export class GamesGateway implements OnGatewayDisconnect, OnModuleDestroy {
  @WebSocketServer() private readonly server!: Server
  private readonly logger = new Logger(GamesGateway.name)
  // Lobbies counting down to the start: game code to when the countdown ends (ms since epoch).
  private readonly startingSoon = new Map<string, number>()
  // Players with a phone connected, by game code: player id to how many sockets they have open
  // (a player with two tabs still counts once).
  private readonly connected = new Map<string, Map<number, number>>()
  // On the results, who has tapped Next for the question being shown, by game code.
  private readonly ready = new Map<string, { number: number; playerIds: Set<number> }>()
  private shuttingDown = false

  constructor(private readonly games: GamesService) {}

  isStartingSoon(code: string) {
    return this.startingSoon.has(code.toUpperCase())
  }

  // Start receiving updates for a game. Phones also say which player they are, so the results
  // know who's still connected. Replies with the current state, so a screen that reconnects
  // catches up on anything it missed while it was offline.
  @SubscribeMessage('watch')
  watch(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: { code?: unknown; playerId?: unknown },
  ) {
    return reply(async () => {
      const code = requireCode(body).toUpperCase()
      if (body.playerId != null) await this.games.findGameForPlayer(code, body.playerId)
      // findGameForPlayer has checked it's a whole number.
      const playerId = isWholeNumber(body.playerId) ? body.playerId : null
      const state = await this.games.getState(code)

      this.stopWatching(socket)
      socket.data.watching = { code, playerId } satisfies Watching
      await socket.join(room(code))
      if (playerId !== null) {
        const sockets = this.connected.get(code) ?? new Map<number, number>()
        sockets.set(playerId, (sockets.get(playerId) ?? 0) + 1)
        this.connected.set(code, sockets)
        // Let the TV show the player as back.
        this.broadcastState(state)
      }
      return { game: this.withLive(state) }
    })
  }

  // A phone dropping out counts as no longer connected, which can mean everyone left is ready.
  async handleDisconnect(socket: Socket) {
    const watching = this.stopWatching(socket)
    // While the app shuts down every socket disconnects; there's nobody left to tell.
    if (watching?.playerId == null || this.shuttingDown) return
    try {
      await this.moveOnIfAllReady(watching.code)
    } catch (err) {
      if (err instanceof NotFoundException) return // The game was deleted.
      this.logger.error(`Couldn't update game ${watching.code} after a disconnect`, err)
    }
  }

  onModuleDestroy() {
    this.shuttingDown = true
  }

  // Any player can press Start in the lobby: every screen counts down, and joining closes.
  @SubscribeMessage('start')
  start(@MessageBody() body: { code?: unknown; playerId?: unknown }) {
    return reply(async () => {
      const code = requireCode(body).toUpperCase()
      await this.games.checkCanStart(code, body.playerId)
      if (this.startingSoon.has(code)) throw new ConflictException('This game is already starting')
      this.startingSoon.set(code, Date.now() + START_COUNTDOWN_MS)
      return { game: await this.broadcast(code) }
    })
  }

  // Any player can stop the start countdown, which reopens the lobby.
  @SubscribeMessage('cancelStart')
  cancelStart(@MessageBody() body: { code?: unknown; playerId?: unknown }) {
    return reply(async () => {
      const code = requireCode(body).toUpperCase()
      await this.games.findGameForPlayer(code, body.playerId)
      if (!this.startingSoon.delete(code)) throw new ConflictException("The game isn't starting")
      return { game: await this.broadcast(code) }
    })
  }

  // Sent by the screens when the start countdown reaches zero. Only the first one counts; the rest
  // (and any after a cancel) get { game: null }.
  @SubscribeMessage('begin')
  begin(@MessageBody() body: { code?: unknown }) {
    return reply(async () => {
      const code = requireCode(body).toUpperCase()
      if (!this.startingSoon.delete(code)) return { game: null }
      const state = await this.games.begin(code)
      if (state) this.broadcastState(state)
      return { game: state && this.withLive(state) }
    })
  }

  // Sent by the TV when the countdown after everyone has voted reaches zero: moves on to the next
  // question, or to the results after the last one. A repeated or stale `next` changes nothing.
  @SubscribeMessage('next')
  next(@MessageBody() body: { code?: unknown; questionNumber?: unknown }) {
    return reply(async () => {
      const state = await this.games.advance(requireCode(body), body.questionNumber)
      if (state) this.broadcastState(state)
      return { game: state && this.withLive(state) }
    })
  }

  @SubscribeMessage('vote')
  vote(
    @MessageBody()
    body: {
      code?: unknown
      playerId?: unknown
      score?: unknown
    },
  ) {
    return reply(async () => {
      const code = requireCode(body)
      const { vote, created } = await this.games.vote(code, body.playerId, body.score)
      // Let the TV tick off the player. Changing a vote doesn't change who has voted.
      if (created) await this.broadcast(code)
      return { vote }
    })
  }

  @SubscribeMessage('chooseQuiz')
  chooseQuiz(
    @MessageBody()
    body: {
      code?: unknown
      quizId?: unknown
    },
  ) {
    return reply(async () => {
      const code = requireCode(body).toUpperCase()
      if (this.startingSoon.has(code)) throw new ConflictException('This game is already starting')

      await this.games.chooseQuiz(code, body.quizId)
      return { game: await this.broadcast(code) }
    })
  }

  // A player tapped Next on the results for question `questionNumber`. It can't be taken back.
  // Once every connected player has, everyone moves on to the next question's results; players
  // who dropped out don't hold the others up. A tap for a question no longer showing changes
  // nothing and gets { game: null }.
  @SubscribeMessage('next-result')
  nextResult(
    @MessageBody()
    body: {
      code?: unknown
      playerId?: unknown
      questionNumber?: unknown
    },
  ) {
    return reply(async () => {
      const code = requireCode(body).toUpperCase()
      await this.games.findGameForPlayer(code, body.playerId)
      const { playerId, questionNumber } = body
      if (!isWholeNumber(playerId) || !isWholeNumber(questionNumber)) {
        throw new BadRequestException('questionNumber is required')
      }

      const state = await this.games.getState(code)
      if (state.status !== 'results') throw new ConflictException("The results aren't showing")
      if (state.question?.number !== questionNumber) return { game: null }

      let entry = this.ready.get(code)
      if (entry?.number !== questionNumber) {
        entry = { number: questionNumber, playerIds: new Set() }
        this.ready.set(code, entry)
      }
      entry.playerIds.add(playerId)
      return { game: await this.moveOnIfAllReady(code) }
    })
  }

  // A player tapped Back to the lobby on the last result: starts a new game for the same players
  // and tells every screen its code, so they all move over. A repeat gets the same new game.
  @SubscribeMessage('back-to-lobby')
  backToLobby(@MessageBody() body: { code?: unknown; playerId?: unknown }) {
    return reply(async () => {
      const code = requireCode(body).toUpperCase()
      await this.games.findGameForPlayer(code, body.playerId)
      const state = await this.games.startNextGame(code)
      if (state) {
        this.ready.delete(code)
        this.broadcastState(state)
      }
      return { game: state && this.withLive(state) }
    })
  }

  broadcastState(state: GameState) {
    this.server.to(room(state.code)).emit('game', this.withLive(state))
  }

  private async broadcast(code: string) {
    const state = await this.games.getState(code)
    this.broadcastState(state)
    return this.withLive(state)
  }

  // On the results, moves on to the next question's once every connected player is ready, then
  // tells every screen (who's ready or connected may have changed either way).
  private async moveOnIfAllReady(code: string) {
    const state = await this.games.getState(code)
    if (state.status === 'results' && state.question) {
      const connected = this.connectedPlayerIds(code)
      const ready = new Set(this.readyPlayerIds(state))
      if (connected.length > 0 && connected.every((id) => ready.has(id))) {
        const moved = await this.games.nextResult(code, state.question.number)
        if (moved) {
          this.ready.delete(code)
          this.broadcastState(moved)
          return this.withLive(moved)
        }
      }
    }
    // Re-read so a concurrent move isn't overwritten on the screens by an older state.
    return this.broadcast(code)
  }

  private stopWatching(socket: Socket): Watching | undefined {
    const watching = socket.data.watching as Watching | undefined
    socket.data.watching = undefined
    if (watching?.playerId == null) return watching

    const sockets = this.connected.get(watching.code)
    const count = (sockets?.get(watching.playerId) ?? 0) - 1
    if (count > 0) sockets?.set(watching.playerId, count)
    else sockets?.delete(watching.playerId)
    if (sockets?.size === 0) this.connected.delete(watching.code)
    return watching
  }

  private connectedPlayerIds(code: string) {
    return [...(this.connected.get(code.toUpperCase())?.keys() ?? [])]
  }

  private readyPlayerIds(state: GameState) {
    const entry = this.ready.get(state.code)
    if (!entry || state.status !== 'results' || entry.number !== state.question?.number) return []
    return [...entry.playerIds]
  }

  // Adds what only lives in memory: how long is left on the start countdown (a duration rather
  // than a clock time, so it doesn't depend on each phone's clock being right), which players are
  // connected, and who has tapped Next on the results.
  private withLive(state: GameState) {
    const endsAt = this.startingSoon.get(state.code)
    return {
      ...state,
      startingInMs: endsAt === undefined ? null : Math.max(0, endsAt - Date.now()),
      connectedPlayerIds: this.connectedPlayerIds(state.code),
      readyPlayerIds: this.readyPlayerIds(state),
    }
  }
}

class MissingCode extends Error {}

function requireCode(body: { code?: unknown } | undefined): string {
  if (typeof body?.code !== 'string') throw new MissingCode('code is required')
  return body.code
}

// Acks the result, or { error } with the reason when the request is refused (bad input, unknown
// game, game already started...), so the screen can show it. Unexpected errors still throw.
async function reply<T>(handle: () => Promise<T>): Promise<T | { error: string }> {
  try {
    return await handle()
  } catch (err) {
    if (err instanceof HttpException || err instanceof MissingCode) return { error: err.message }
    throw err
  }
}
