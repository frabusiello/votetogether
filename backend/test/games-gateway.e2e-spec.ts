import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import { eq } from 'drizzle-orm'
import { io, type Socket } from 'socket.io-client'
import request from 'supertest'
import { App } from 'supertest/types.js'
import { AppModule } from './../src/app.module.js'
import { DB, type Db } from './../src/db/db.module.js'
import { games, votes } from './../src/db/schema.js'

type GameState = {
  id: number
  code: string
  status: string
  startingInMs: number | null
  players: { id: number; name: string }[]
  nextCode: string | null
  question: {
    number: number
    total: number
    votedPlayerIds: number[]
    votes: { playerId: number; score: number }[] | null
  } | null
  connectedPlayerIds: number[]
  readyPlayerIds: number[]
}

describe('GamesGateway (e2e)', () => {
  let app: INestApplication<App>
  let db: Db
  let socket: Socket
  let code: string

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    await app.listen(0)
    db = app.get(DB)

    const created = await request(app.getHttpServer()).post('/games').expect(201)
    code = created.body.code

    socket = io(await app.getUrl(), { path: '/api/socket.io', transports: ['websocket'] })
  })

  afterEach(async () => {
    socket.disconnect()
    await db.delete(games).where(eq(games.code, code))
    await app.close()
  })

  const watch = (gameCode: string) =>
    socket.emitWithAck('watch', { code: gameCode }) as Promise<{ game?: GameState; error?: string }>
  const nextUpdate = () => new Promise<GameState>((resolve) => socket.once('game', resolve))
  const join = (name: string) =>
    request(app.getHttpServer()).post(`/games/${code}/players`).send({ name }).expect(201)

  it('replies to watch with the current game, or an error for an unknown code', async () => {
    const reply = await watch(code.toLowerCase())
    expect(reply.game).toMatchObject({ code, players: [] })

    expect(await watch('NOPE')).toEqual({ error: 'No game with code NOPE' })
  })

  it('pushes the updated game to watchers when a new player joins, but not on a rejoin', async () => {
    await watch(code)

    const update = nextUpdate()
    await join('Ana')
    expect((await update).players.map((p) => p.name)).toEqual(['Ana'])

    const onGame = vi.fn()
    socket.on('game', onGame)
    await join('ana')
    await new Promise((resolve) => setTimeout(resolve, 200))
    expect(onGame).not.toHaveBeenCalled()
  })

  type Ack = { game?: GameState | null; error?: string }
  const send = (event: string, payload: object) =>
    socket.emitWithAck(event, { code, ...payload }) as Promise<Ack>

  describe('start, cancelStart and begin', () => {
    let anaId: number
    let benId: number

    beforeEach(async () => {
      anaId = (await join('Ana')).body.id
      benId = (await join('Ben')).body.id
      await watch(code)
    })

    it('starts a countdown on every screen and closes joining, then begin moves to question 1', async () => {
      expect(await send('start', { playerId: anaId + 100_000 })).toEqual({
        error: "You're not in this game",
      })
      // Nothing to begin before anyone presses Start.
      expect(await send('begin', {})).toEqual({ game: null })

      const countdown = nextUpdate()
      const started = await send('start', { playerId: anaId })
      expect(started.game).toMatchObject({ status: 'lobby', startingInMs: expect.any(Number) })
      expect(started.game?.startingInMs).toBeGreaterThan(0)
      expect((await countdown).startingInMs).toEqual(expect.any(Number))
      expect((await watch(code)).game?.startingInMs).toEqual(expect.any(Number))

      expect(await send('start', { playerId: benId })).toEqual({
        error: 'This game is already starting',
      })
      const late = await request(app.getHttpServer())
        .post(`/games/${code}/players`)
        .send({ name: 'Chiara' })
        .expect(409)
      expect(late.body.message).toBe('This game is about to start')
      await join('ana') // Players already in can still rejoin.

      const playing = nextUpdate()
      const begun = await send('begin', {})
      expect(begun.game).toMatchObject({
        status: 'playing',
        startingInMs: null,
        question: { number: 1 },
      })
      expect(await playing).toEqual(begun.game)

      // Other screens finishing their countdown a moment later change nothing.
      expect(await send('begin', {})).toEqual({ game: null })
      expect(await send('start', { playerId: anaId })).toEqual({
        error: 'This game has already started',
      })
    })

    it('lets any player cancel the countdown, which reopens the lobby', async () => {
      expect(await send('cancelStart', { playerId: benId })).toEqual({
        error: "The game isn't starting",
      })
      await send('start', { playerId: anaId })

      const update = nextUpdate()
      const cancelled = await send('cancelStart', { playerId: benId })
      expect(cancelled.game).toMatchObject({ status: 'lobby', startingInMs: null })
      expect(await update).toEqual(cancelled.game)

      // A screen whose countdown still ran out doesn't start the game, and joining is open again.
      expect(await send('begin', {})).toEqual({ game: null })
      await join('Chiara')
    })
  })

  describe('next', () => {
    let anaId: number

    beforeEach(async () => {
      anaId = (await join('Ana')).body.id
      await watch(code)
      await send('start', { playerId: anaId })
      await send('begin', {})
    })

    it('moves on to the next question once, however many times it is sent', async () => {
      await send('vote', { playerId: anaId, score: 7 })

      const update = nextUpdate()
      const next = await send('next', { questionNumber: 1 })
      expect(next.game).toMatchObject({
        status: 'playing',
        question: { number: 2, votedPlayerIds: [] },
      })
      expect(await update).toEqual(next.game)

      expect(await send('next', { questionNumber: 1 })).toEqual({ game: null })
      expect(await send('next', {})).toEqual({ error: 'questionNumber is required' })
    })

    it('goes to the results after the last question', async () => {
      const total = (await watch(code)).game?.question?.total ?? 0
      await db
        .update(games)
        .set({ currentItemIndex: total - 1 })
        .where(eq(games.code, code))

      const results = await send('next', { questionNumber: total })
      expect(results.game).toMatchObject({ status: 'results' })
    })
  })

  describe('vote', () => {
    let anaId: number

    beforeEach(async () => {
      anaId = (await join('Ana')).body.id
      await watch(code)
    })

    const vote = (score: unknown, playerId: unknown = anaId) =>
      socket.emitWithAck('vote', { code, playerId, score }) as Promise<{
        vote?: { itemId: number; score: number }
        error?: string
      }>
    // Starts the game, as a screen does when its countdown runs out.
    const start = async () => {
      await send('start', { playerId: anaId })
      await send('begin', {})
    }

    it('is closed while the game is in the lobby', async () => {
      expect(await vote(7)).toEqual({ error: "Voting isn't open right now" })
    })

    it('pushes the updated game on a first vote, but not when the vote changes', async () => {
      await start()

      const update = nextUpdate()
      expect(await vote(7)).toEqual({ vote: { itemId: expect.any(Number), score: 7 } })
      expect((await update).question?.votedPlayerIds).toEqual([anaId])

      const onGame = vi.fn()
      socket.on('game', onGame)
      expect((await vote(9)).vote?.score).toBe(9)
      await new Promise((resolve) => setTimeout(resolve, 200))
      expect(onGame).not.toHaveBeenCalled()

      const [game] = await db.select({ id: games.id }).from(games).where(eq(games.code, code))
      const rows = await db
        .select({ score: votes.score })
        .from(votes)
        .where(eq(votes.gameId, game.id))
      expect(rows).toEqual([{ score: 9 }])
    })

    it('rejects scores outside 1–10 and players who are not in the game', async () => {
      await start()
      for (const score of [0, 11, 7.5, '7', undefined]) {
        expect((await vote(score)).error).toBe('Score must be a whole number from 1 to 10')
      }
      expect(await vote(7, anaId + 100_000)).toEqual({ error: "You're not in this game" })
    })
  })
  describe('results', () => {
    let anaId: number
    let benId: number
    let total: number
    const phones: Socket[] = []
    // New games started from the results, deleted after each test.
    const nextCodes: string[] = []

    // A player's phone: its own socket, watching the game as that player.
    const connectPhone = async (playerId: number) => {
      const phone = io(await app.getUrl(), { path: '/api/socket.io', transports: ['websocket'] })
      phones.push(phone)
      await phone.emitWithAck('watch', { code, playerId })
      return phone
    }
    const tapNext = (phone: Socket, playerId: number, questionNumber: number) =>
      phone.emitWithAck('next-result', { code, playerId, questionNumber }) as Promise<Ack>
    // The TV's view once an update that matches `check` arrives.
    const updateWhere = (check: (game: GameState) => boolean) =>
      new Promise<GameState>((resolve) => {
        const onGame = (game: GameState) => {
          if (!check(game)) return
          socket.off('game', onGame)
          resolve(game)
        }
        socket.on('game', onGame)
      })

    beforeEach(async () => {
      anaId = (await join('Ana')).body.id
      benId = (await join('Ben')).body.id
      await watch(code)
      await send('start', { playerId: anaId })
      const started = await send('begin', {})
      total = started.game?.question?.total ?? 0

      // Everyone votes on question 1, then the game skips to the last question and finishes it.
      await send('vote', { playerId: anaId, score: 7 })
      await send('vote', { playerId: benId, score: 9 })
      expect((await watch(code)).game?.question?.votes).toBeNull() // Hidden while playing.
      await db
        .update(games)
        .set({ currentItemIndex: total - 1 })
        .where(eq(games.code, code))
    })

    afterEach(async () => {
      for (const phone of phones.splice(0)) phone.disconnect()
      for (const nextCode of nextCodes.splice(0)) {
        await db.delete(games).where(eq(games.code, nextCode))
      }
      // Let the server finish handling the disconnects before the game and the app go away.
      await new Promise((resolve) => setTimeout(resolve, 100))
    })

    it('shows who voted what, one question at a time, moving on once every connected player taps Next', async () => {
      const ana = await connectPhone(anaId)
      const ben = await connectPhone(benId)
      expect(await tapNext(ana, anaId, 1)).toEqual({ error: "The results aren't showing" })

      const results = await send('next', { questionNumber: total })
      expect(results.game).toMatchObject({
        status: 'results',
        connectedPlayerIds: expect.arrayContaining([anaId, benId]),
        readyPlayerIds: [],
        // Unvoted questions come first, see the ordering test below.
        question: { number: 1, votes: [] },
      })

      const anaReady = await tapNext(ana, anaId, 1)
      expect(anaReady.game).toMatchObject({ readyPlayerIds: [anaId], question: { number: 1 } })
      expect((await tapNext(ana, anaId, 1)).game?.question?.number).toBe(1) // Tapping twice is fine.
      expect(await tapNext(ana, anaId, 2)).toEqual({ game: null }) // Not showing yet.

      const moved = await tapNext(ben, benId, 1)
      expect(moved.game).toMatchObject({ readyPlayerIds: [], question: { number: 2, votes: [] } })
      expect(await tapNext(ben, benId, 1)).toEqual({ game: null }) // A late tap changes nothing.
    })

    it('goes from the most agreed-on question to the most disputed, unvoted ones first', async () => {
      const ana = await connectPhone(anaId)
      const ben = await connectPhone(benId)
      // Question 1 got 7 and 9. Question 2 gets 5 and 5, and the last question 1 and 10.
      const voteOn = async (number: number, anaScore: number, benScore: number) => {
        await db
          .update(games)
          .set({ currentItemIndex: number - 1 })
          .where(eq(games.code, code))
        await send('vote', { playerId: anaId, score: anaScore })
        await send('vote', { playerId: benId, score: benScore })
      }
      await voteOn(2, 5, 5)
      await voteOn(total, 1, 10)

      const shown: { number: number; votes: { playerId: number; score: number }[] }[] = []
      let game = (await send('next', { questionNumber: total })).game
      for (let number = 1; number <= total; number++) {
        shown.push({ number: game!.question!.number, votes: game!.question!.votes! })
        await tapNext(ana, anaId, number)
        game = (await tapNext(ben, benId, number)).game
      }

      expect(shown.map((s) => s.number)).toEqual(Array.from({ length: total }, (_, i) => i + 1))
      const scores = (anaScore: number, benScore: number) => [
        { playerId: anaId, score: anaScore },
        { playerId: benId, score: benScore },
      ]
      expect(shown.map((s) => s.votes)).toEqual([
        ...Array.from({ length: total - 3 }, () => []),
        scores(5, 5),
        scores(7, 9),
        scores(1, 10),
      ])
    })

    it('starts a new game for the same players from the last result', async () => {
      const ana = await connectPhone(anaId)
      const backToLobby = () =>
        ana.emitWithAck('back-to-lobby', { code, playerId: anaId }) as Promise<Ack>
      expect(await backToLobby()).toEqual({ game: null }) // Still playing.

      await send('next', { questionNumber: total })
      expect(await backToLobby()).toEqual({ game: null }) // Not at the end of the results yet.
      expect(await send('back-to-lobby', { playerId: 9999 })).toEqual({
        error: "You're not in this game",
      })

      await db
        .update(games)
        .set({ currentItemIndex: total - 1 })
        .where(eq(games.code, code))
      const toTv = updateWhere((game) => game.nextCode !== null)
      const old = await backToLobby()
      const nextCode = old.game!.nextCode!
      nextCodes.push(nextCode)
      expect(nextCode).toMatch(/^[A-Z]{4}$/)
      expect(nextCode).not.toBe(code)
      // The old game stays on its last result, telling every screen where everyone went.
      expect(old.game).toMatchObject({ status: 'results', question: { number: total } })
      expect((await toTv).nextCode).toBe(nextCode)
      expect((await backToLobby()).game?.nextCode).toBe(nextCode) // A repeat finds the same game.

      // The new game is a fresh lobby with everyone in it, and the phones rejoin by name.
      const next = await request(app.getHttpServer()).get(`/games/${nextCode}`).expect(200)
      expect(next.body).toMatchObject({ status: 'lobby', nextCode: null })
      expect(next.body.players.map((p: { name: string }) => p.name)).toEqual(['Ana', 'Ben'])
      const rejoined = await request(app.getHttpServer())
        .post(`/games/${nextCode}/players`)
        .send({ name: 'Ana' })
        .expect(201)
      expect(rejoined.body.id).toBe(next.body.players[0].id)
    })

    it("doesn't wait for players who dropped out", async () => {
      const ana = await connectPhone(anaId)
      const ben = await connectPhone(benId)
      await send('next', { questionNumber: total })

      // Ben leaves before tapping: Ana's tap alone moves on.
      const benGone = updateWhere((game) => !game.connectedPlayerIds.includes(benId))
      ben.disconnect()
      expect((await benGone).connectedPlayerIds).toEqual([anaId])
      expect((await tapNext(ana, anaId, 1)).game?.question?.number).toBe(2)

      // Ben comes back and Ana taps, then Ben drops out: his leaving is what moves things on.
      const benAgain = await connectPhone(benId)
      expect((await tapNext(ana, anaId, 2)).game).toMatchObject({ question: { number: 2 } })
      const onToThree = updateWhere((game) => game.question?.number === 3)
      benAgain.disconnect()
      expect((await onToThree).readyPlayerIds).toEqual([])
    })
  })
})
