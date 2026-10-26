import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import { eq, inArray } from 'drizzle-orm'
import request from 'supertest'
import { App } from 'supertest/types.js'
import { AppModule } from './../src/app.module.js'
import { DB, type Db } from './../src/db/db.module.js'
import { games, players } from './../src/db/schema.js'

describe('GamesController (e2e)', () => {
  let app: INestApplication<App>
  let db: Db
  const createdIds: number[] = []

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    await app.init()
    db = app.get(DB)
  })

  it('/games (POST) creates lobby games in the default quiz with distinct join codes', async () => {
    const first = await request(app.getHttpServer()).post('/games').expect(201)
    const second = await request(app.getHttpServer()).post('/games').expect(201)
    createdIds.push(first.body.id, second.body.id)

    for (const { body } of [first, second]) {
      expect(body).toEqual({
        id: expect.any(Number),
        code: expect.stringMatching(/^[A-Z]{4}$/),
        status: 'lobby',
        quiz: { id: expect.any(Number), name: 'Foods' },
        players: [],
        nextCode: null,
        // The questions are copied in when the game begins.
        question: null,
      })
    }
    expect(first.body.code).not.toBe(second.body.code)
  })

  it('/games/:code (GET) lists the players who joined', async () => {
    const created = await request(app.getHttpServer()).post('/games').expect(201)
    createdIds.push(created.body.id)
    await db.insert(players).values([
      { gameId: created.body.id, name: 'Ana' },
      { gameId: created.body.id, name: 'Ben' },
    ])

    const found = await request(app.getHttpServer()).get(`/games/${created.body.code}`).expect(200)
    expect(found.body.players).toEqual([
      { id: expect.any(Number), name: 'Ana' },
      { id: expect.any(Number), name: 'Ben' },
    ])
  })

  it('/games/:code (GET) finds a game by code, case-insensitively', async () => {
    const created = await request(app.getHttpServer()).post('/games').expect(201)
    createdIds.push(created.body.id)

    const found = await request(app.getHttpServer())
      .get(`/games/${created.body.code.toLowerCase()}`)
      .expect(200)
    expect(found.body).toEqual(created.body)
  })

  describe('/games/:code/players (POST)', () => {
    let code: string

    beforeEach(async () => {
      const created = await request(app.getHttpServer()).post('/games').expect(201)
      createdIds.push(created.body.id)
      code = created.body.code
    })

    const join = (gameCode: string, name: unknown) =>
      request(app.getHttpServer()).post(`/games/${gameCode}/players`).send({ name })

    it('adds a trimmed player who then shows up in the game', async () => {
      const joined = await join(code.toLowerCase(), '  Ana  ').expect(201)
      expect(joined.body).toEqual({ id: expect.any(Number), name: 'Ana' })

      const found = await request(app.getHttpServer()).get(`/games/${code}`).expect(200)
      expect(found.body.players).toEqual([joined.body])
    })

    it('rejoins as the existing player when the name is already in the game, in any case', async () => {
      const first = await join(code, 'Ana').expect(201)
      const again = await join(code, 'ana').expect(201)
      expect(again.body).toEqual(first.body)

      const found = await request(app.getHttpServer()).get(`/games/${code}`).expect(200)
      expect(found.body.players).toHaveLength(1)
    })

    it('rejects empty and overlong names', async () => {
      await join(code, '   ').expect(400)
      await join(code, 'x'.repeat(21)).expect(400)
      await join(code, undefined).expect(400)
    })

    it('returns 404 for an unknown code', async () => {
      await join('NOPE', 'Ana').expect(404)
    })

    it('turns away new players once the game has 20, but lets existing ones rejoin', async () => {
      const [{ id }] = await db.select({ id: games.id }).from(games).where(eq(games.code, code))
      await db
        .insert(players)
        .values(Array.from({ length: 20 }, (_, i) => ({ gameId: id, name: `Player ${i + 1}` })))

      const full = await join(code, 'Ana').expect(409)
      expect(full.body.message).toBe('This game is full (20 players)')
      await join(code, 'Player 7').expect(201)
    })

    it('lets existing players rejoin a started game, but not new ones', async () => {
      const ana = await join(code, 'Ana').expect(201)
      await db.update(games).set({ status: 'playing' }).where(eq(games.code, code))

      await join(code, 'Ben').expect(409)
      const again = await join(code, 'Ana').expect(201)
      expect(again.body).toEqual(ana.body)
    })
  })

  it('/games/:code (GET) returns 404 for an unknown code', () => {
    // Contains an O, so it can never be generated.
    return request(app.getHttpServer()).get('/games/NOPE').expect(404)
  })

  afterEach(async () => {
    if (createdIds.length) {
      await db.delete(games).where(inArray(games.id, createdIds.splice(0)))
    }
    await app.close()
  })
})
