import { type CSSProperties, type FormEvent, useEffect, useRef, useState } from 'react'
import {
  clearHostedGameCode,
  clearPlayerSeat,
  createGame,
  fetchGame,
  fetchServerConfig,
  type Game,
  type Item,
  GameNotFoundError,
  getHostedGameCode,
  getPlayerSeat,
  getSavedVote,
  JoinError,
  joinGame,
  type Player,
  type PlayerSeat,
  type Question,
  saveHostedGameCode,
  savePlayerSeat,
  saveVote,
  type ServerConfig,
} from './game'
import {
  beginGame,
  cancelStart,
  castVote,
  nextQuestion,
  readyForNextResult,
  type Send,
  SocketError,
  startGame,
  useGameSocket,
} from './socket'
import './App.css'

// A game saved in a cookie that this browser can reconnect to, either as the TV or as a player.
type SavedGame = { as: 'host'; code: string } | { as: 'player'; seat: PlayerSeat }

type Screen =
  | { name: 'home' }
  | { name: 'join' }
  | { name: 'restoring'; saved: SavedGame }
  | { name: 'offline'; saved: SavedGame }
  | { name: 'game'; game: Game }
  | { name: 'player'; game: Game; player: Player }

function getSavedGame(): SavedGame | null {
  const code = getHostedGameCode()
  if (code) return { as: 'host', code }
  const seat = getPlayerSeat()
  return seat ? { as: 'player', seat } : null
}

function savedCode(saved: SavedGame) {
  return saved.as === 'host' ? saved.code : saved.seat.code
}

function App() {
  const [screen, setScreen] = useState<Screen>(() => {
    const saved = getSavedGame()
    return saved ? { name: 'restoring', saved } : { name: 'home' }
  })

  // Reconnect to the game saved in a cookie. Only a missing game (or player) forgets it: a network
  // error keeps it so the screen can retry once the connection is back.
  function loadSavedGame(saved: SavedGame) {
    const forget = () => {
      if (saved.as === 'host') clearHostedGameCode()
      else clearPlayerSeat()
      setScreen({ name: 'home' })
    }

    fetchGame(savedCode(saved))
      .then((game) => {
        if (saved.as === 'host') return setScreen({ name: 'game', game })
        const player = game.players.find((p) => p.id === saved.seat.playerId)
        if (player) setScreen({ name: 'player', game, player })
        else forget()
      })
      .catch((err: unknown) => {
        if (err instanceof GameNotFoundError) forget()
        else setScreen({ name: 'offline', saved })
      })
  }

  useEffect(() => {
    const saved = getSavedGame()
    if (saved) loadSavedGame(saved)
  }, [])

  // The TV and the phones follow their game live (players joining, the game starting, votes), and
  // phones send their actions over the same connection.
  const liveCode = screen.name === 'game' || screen.name === 'player' ? screen.game.code : null
  const livePlayerId = screen.name === 'player' ? screen.player.id : null
  const send = useGameSocket(liveCode, livePlayerId, (game) =>
    setScreen((current) => {
      if (current.name === 'game') return { name: 'game', game }
      if (current.name === 'player') {
        const player = game.players.find((p) => p.id === current.player.id)
        return player ? { name: 'player', game, player } : current
      }
      return current
    }),
  )

  switch (screen.name) {
    case 'restoring':
      return (
        <main className="screen">
          <p>Reconnecting to game {savedCode(screen.saved)}…</p>
        </main>
      )

    case 'offline':
      return (
        <main className="screen">
          <h1>Can't reach the server</h1>
          <p>Your game {savedCode(screen.saved)} is saved. Check the connection and try again.</p>
          <div className="actions">
            <button
              type="button"
              className="primary"
              onClick={() => {
                setScreen({ name: 'restoring', saved: screen.saved })
                loadSavedGame(screen.saved)
              }}
            >
              Retry
            </button>
          </div>
        </main>
      )

    case 'player':
      return (
        <PlayerScreen
          game={screen.game}
          player={screen.player}
          send={send}
          onLeave={() => {
            clearPlayerSeat()
            setScreen({ name: 'home' })
          }}
        />
      )

    case 'game':
      return (
        <GameScreen
          game={screen.game}
          send={send}
          onStartOver={() => {
            clearHostedGameCode()
            setScreen({ name: 'home' })
          }}
        />
      )

    case 'join':
      return (
        <JoinScreen
          onJoined={(seat) => {
            // Load the game the same way as a reconnect, so a dropped connection right after
            // joining lands on the Retry screen instead of losing the seat.
            const saved: SavedGame = { as: 'player', seat }
            setScreen({ name: 'restoring', saved })
            loadSavedGame(saved)
          }}
          onBack={() => setScreen({ name: 'home' })}
        />
      )

    case 'home':
      return (
        <HomeScreen
          onCreated={(game) => setScreen({ name: 'game', game })}
          onJoin={() => setScreen({ name: 'join' })}
        />
      )
  }
}

function HomeScreen({
  onCreated,
  onJoin,
}: {
  onCreated: (game: Game) => void
  onJoin: () => void
}) {
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate() {
    setCreating(true)
    setError(null)
    try {
      const game = await createGame()
      saveHostedGameCode(game.code)
      onCreated(game)
    } catch {
      setError("Couldn't create a game. Check the connection and try again.")
      setCreating(false)
    }
  }

  return (
    <main className="screen">
      <h1>Vote Together</h1>
      <p className="tagline">How much does everyone love cheese? Find out together.</p>
      <div className="actions">
        <button type="button" className="primary" onClick={handleCreate} disabled={creating}>
          {creating ? 'Creating…' : 'Create game'}
        </button>
        <button type="button" className="secondary" onClick={onJoin} disabled={creating}>
          Join game
        </button>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </main>
  )
}

function JoinScreen({
  onJoined,
  onBack,
}: {
  onJoined: (seat: PlayerSeat) => void
  onBack: () => void
}) {
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setJoining(true)
    setError(null)
    try {
      const player = await joinGame(code, name)
      const seat = { code, playerId: player.id }
      savePlayerSeat(seat)
      onJoined(seat)
    } catch (err) {
      setError(
        err instanceof JoinError
          ? err.message
          : "Couldn't join. Check the connection and try again.",
      )
      setJoining(false)
    }
  }

  return (
    <main className="screen">
      <h1>Join a game</h1>
      <form className="join-form" onSubmit={handleSubmit}>
        <label>
          Game code
          <input
            className="code-input"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))}
            maxLength={4}
            minLength={4}
            required
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            placeholder="ABCD"
          />
        </label>
        <label>
          Your name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
            required
            autoComplete="nickname"
            placeholder="Ana"
          />
        </label>
        <div className="actions">
          <button type="submit" className="primary" disabled={joining}>
            {joining ? 'Joining…' : 'Join'}
          </button>
        </div>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </form>
      <BackButton onClick={onBack} />
    </main>
  )
}

type PlayerScreenProps = { game: Game; player: Player; send: Send; onLeave: () => void }

// A player's phone screen for a game, which depends on how far along the game is.
function PlayerScreen(props: PlayerScreenProps) {
  const { game, player, send } = props
  switch (game.status) {
    case 'lobby':
      return <PlayerLobbyScreen {...props} />
    case 'playing':
      return game.question ? (
        // Keyed by question so the picked score resets when the question changes.
        <VoteScreen
          key={game.question.number}
          code={game.code}
          player={player}
          question={game.question}
          playerCount={game.players.length}
          send={send}
        />
      ) : (
        <main className="screen">
          <p>This game has no questions.</p>
        </main>
      )
    case 'results':
      return game.question ? (
        <PlayerResultsScreen
          key={game.question.number}
          game={game}
          question={game.question}
          player={player}
          send={send}
        />
      ) : (
        <main className="screen">
          <h1>That's a wrap!</h1>
          <p>Check the TV to see how everyone voted.</p>
        </main>
      )
  }
}

const SCORES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
const STARTING_SCORE = 5

function VoteScreen({
  code,
  player,
  question,
  playerCount,
  send,
}: {
  code: string
  player: Player
  question: Question
  playerCount: number
  send: Send
}) {
  const voteKey = { code, playerId: player.id, questionNumber: question.number }
  // What the server last accepted from this phone, remembered across refreshes on this device.
  const [votedScore, setVotedScore] = useState<number | null>(() => getSavedVote(voteKey))
  const [value, setValue] = useState(() => votedScore ?? STARTING_SCORE)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // The server knows they voted even when this device has forgotten the score.
  const votedElsewhere = votedScore === null && question.votedPlayerIds.includes(player.id)

  async function handleVote() {
    setSending(true)
    setError(null)
    try {
      const vote = await castVote(send, code, player.id, value)
      setVotedScore(vote.score)
      saveVote(voteKey, vote.score)
    } catch (err) {
      setError(
        err instanceof SocketError
          ? err.message
          : "Couldn't send your vote. Check the connection and try again.",
      )
    } finally {
      setSending(false)
    }
  }

  let buttonLabel = `Vote ${value}`
  if (sending) buttonLabel = 'Sending…'
  else if (votedScore === value) buttonLabel = `Voted ${value} ✓`
  else if (votedScore !== null) buttonLabel = `Change to ${value}`
  else if (votedElsewhere) buttonLabel = `Vote again: ${value}`

  return (
    // The score's class colours the slider's thumb and the big number as the player slides.
    <main className={`screen score-${value}`}>
      <p className="question-number">
        Question {question.number} of {question.total}
      </p>
      <h1 className="vote-name">{question.item.name}</h1>
      <p className="score-card" aria-hidden="true">
        {value}
      </p>
      <div className="slider-field">
        <input
          className="slider"
          type="range"
          min={SCORES[0]}
          max={SCORES[SCORES.length - 1]}
          step={1}
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          aria-label="Your score from 1 to 10"
          aria-valuetext={`${value} out of 10`}
        />
        <div className="slider-ticks" aria-hidden="true">
          {SCORES.map((score) => (
            <span key={score}>{score}</span>
          ))}
        </div>
        <div className="scale-labels" aria-hidden="true">
          <span>Hate it</span>
          <span>Love it</span>
        </div>
      </div>
      <div className="actions">
        <button
          type="button"
          className={!sending && votedScore === value ? 'primary done' : 'primary'}
          disabled={sending || votedScore === value}
          onClick={handleVote}
        >
          {buttonLabel}
        </button>
      </div>
      <p role="status">
        {question.votedPlayerIds.length >= playerCount
          ? "Everyone's voted! Next question coming up."
          : votedScore !== null
            ? `Your vote is in: ${votedScore}. Slide to change it.`
            : votedElsewhere
              ? 'Your vote is in. Slide and vote again to change it.'
              : 'Slide to pick a score, then vote.'}
      </p>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </main>
  )
}

function PlayerLobbyScreen({ game, player, send, onLeave }: PlayerScreenProps) {
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Start and cancel change the game for everyone: the server pushes the result to every screen
  // (this one included), so there's nothing to do with the reply here.
  async function handle(action: typeof startGame, failure: string) {
    setSending(true)
    setError(null)
    try {
      await action(send, game.code, player.id)
    } catch (err) {
      setError(err instanceof SocketError ? err.message : failure)
    } finally {
      setSending(false)
    }
  }

  const count = game.players.length
  if (game.startingInMs != null) {
    return (
      <main className="screen">
        <StartCountdown ms={game.startingInMs} code={game.code} send={send} />
        <p>Someone still joining? Anyone can stop the countdown.</p>
        <div className="actions">
          <button
            type="button"
            className="secondary"
            disabled={sending}
            onClick={() =>
              handle(cancelStart, "Couldn't cancel. Check the connection and try again.")
            }
          >
            {sending ? 'Cancelling…' : 'Cancel'}
          </button>
        </div>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </main>
    )
  }

  return (
    <main className="screen">
      <h1>You're in, {player.name}!</h1>
      <p>
        Game <strong>{game.code}</strong>
        {game.category && <> · {game.category.name}</>} ·{' '}
        <strong>
          {count} {count === 1 ? 'player' : 'players'} in
        </strong>
      </p>
      <ul className="players" aria-label="Players">
        {game.players.map((p) => (
          <li key={p.id}>{p.name}</li>
        ))}
      </ul>
      <p>Start the game when everyone's here.</p>
      <div className="actions">
        <button
          type="button"
          className="primary"
          disabled={sending}
          onClick={() =>
            handle(startGame, "Couldn't start the game. Check the connection and try again.")
          }
        >
          {sending ? 'Starting…' : 'Start game'}
        </button>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <button type="button" className="link" onClick={onLeave}>
        Leave
      </button>
    </main>
  )
}

// Counts down to the first question. The server sends the time left rather than a clock time, so
// the deadline is set from this device's clock when the update arrives; key it by `ms` so each
// update resyncs it.
// Countdowns run here on the screens, not on the server: when one reaches zero, `onDone` tells
// the server to move the game on.
function Countdown({
  ms,
  label,
  doneLabel,
  onDone,
}: {
  ms: number
  label: string
  doneLabel: string
  onDone: () => void
}) {
  const [deadline] = useState(() => Date.now() + ms)
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 200)
    return () => clearInterval(timer)
  }, [])

  const seconds = Math.max(0, Math.ceil((deadline - now) / 1000))
  const onDoneRef = useRef(onDone)
  useEffect(() => {
    onDoneRef.current = onDone
  })
  const done = seconds === 0
  useEffect(() => {
    if (done) onDoneRef.current()
  }, [done])

  return (
    <div className="countdown" role="timer" aria-live="polite">
      <p className="countdown-label">{done ? doneLabel : label}</p>
      <p className="score-card" aria-label={`${seconds} seconds`}>
        {seconds}
      </p>
    </div>
  )
}

// The countdown after someone presses Start. Every screen sends `begin` when it reaches zero; the
// server only acts on the first. Keyed by `ms` so each update from the server resyncs it.
function StartCountdown({ ms, code, send }: { ms: number; code: string; send: Send }) {
  return (
    <Countdown
      key={ms}
      ms={ms}
      label="Starting in"
      doneLabel="Here we go!"
      onDone={() => beginGame(send, code).catch(() => {})}
    />
  )
}

// The shared TV screen for a game, which depends on how far along the game is.
type GameScreenProps = { game: Game; send: Send; onStartOver: () => void }

function GameScreen({ game, send, onStartOver }: GameScreenProps) {
  switch (game.status) {
    case 'lobby':
      return <LobbyScreen game={game} send={send} onStartOver={onStartOver} />
    case 'playing':
      return game.question ? (
        <QuestionScreen
          code={game.code}
          question={game.question}
          players={game.players}
          send={send}
        />
      ) : (
        <main className="screen">
          <p>This game has no questions.</p>
        </main>
      )
    case 'results':
      return game.question ? (
        <ResultsScreen game={game} question={game.question} />
      ) : (
        <main className="screen">
          <h1>That's a wrap!</h1>
        </main>
      )
  }
}

// Where players should go to join, as shown on the TV:
// 1. PUBLIC_URL, when the server has one set (a domain, or a NAS's fixed name or IP).
// 2. Otherwise the address the TV was opened with, e.g. http://192.168.1.20:5174 on a home server.
// 3. Except when the TV is on the server itself via localhost, which phones can't reach: then the
//    server's local network IP, on the same port.
function useJoinAddress() {
  const [config, setConfig] = useState<ServerConfig | null>(null)
  useEffect(() => {
    fetchServerConfig()
      .then(setConfig)
      .catch(() => {})
  }, [])

  const { hostname, host, port } = window.location
  if (config?.publicUrl) return config.publicUrl.replace(/^https?:\/\//, '').replace(/\/+$/, '')
  const onThisMachine = ['localhost', '127.0.0.1', '[::1]'].includes(hostname)
  if (onThisMachine && config?.lanAddress) {
    return port ? `${config.lanAddress}:${port}` : config.lanAddress
  }
  return host
}

function LobbyScreen({ game, send, onStartOver }: GameScreenProps) {
  const joinAddress = useJoinAddress()
  // Once someone presses Start, joining is closed, so the code gives way to the countdown.
  if (game.startingInMs != null) {
    return (
      <main className="screen">
        <StartCountdown ms={game.startingInMs} code={game.code} send={send} />
        <ul className="players" aria-label="Players">
          {game.players.map((player) => (
            <li key={player.id}>{player.name}</li>
          ))}
        </ul>
        <p className="tagline">Someone missing? Cancel from any phone.</p>
      </main>
    )
  }

  return (
    <main className="screen">
      <p className="tagline">
        Go to <strong>{joinAddress}</strong> and join with the code
      </p>
      <div className="game-code" role="img" aria-label={`Game code ${game.code.split('').join(' ')}`}>
        {game.code.split('').map((letter, i) => (
          <span key={i}>{letter}</span>
        ))}
      </div>
      {game.category && (
        <p>
          Tonight: <strong>{game.category.name}</strong>
        </p>
      )}
      {game.players.length > 0 ? (
        <ul className="players" aria-label="Players">
          {game.players.map((player) => (
            <li key={player.id}>{player.name}</li>
          ))}
        </ul>
      ) : (
        <p>Waiting for players…</p>
      )}
      <button type="button" className="link" onClick={onStartOver}>
        Start over
      </button>
    </main>
  )
}

// Once everyone has voted, the TV counts down this long before moving on.
const NEXT_QUESTION_COUNTDOWN_MS = 5_000

function QuestionScreen({
  code,
  question,
  players,
  send,
}: {
  code: string
  question: Question
  players: Player[]
  send: Send
}) {
  const { item } = question
  const voted = new Set(question.votedPlayerIds)
  const everyoneVoted = players.length > 0 && voted.size >= players.length
  const isLast = question.number >= question.total
  return (
    <main className="screen">
      <p className="question-number">
        Question {question.number} of {question.total}
      </p>
      {everyoneVoted ? (
        // The TV drives the game on: when this reaches zero it asks the server for the next
        // question, which then reaches the phones too. Keyed by question so it restarts for each.
        <Countdown
          key={question.number}
          ms={NEXT_QUESTION_COUNTDOWN_MS}
          label={isLast ? "Everyone's voted! Results in" : "Everyone's voted! Next question in"}
          doneLabel={isLast ? 'Here come the results!' : 'Next question!'}
          onDone={() => nextQuestion(send, code, question.number).catch(() => {})}
        />
      ) : (
        <QuestionImage item={item} />
      )}
      <h1 className="question-name">{item.name}</h1>
      <p>
        Vote 1–10 on your phone ·{' '}
        <strong>
          {voted.size} of {players.length} voted
        </strong>
      </p>
      <ul className="players votes" aria-label="Who has voted">
        {players.map((player) => (
          <li key={player.id} className={voted.has(player.id) ? 'voted' : undefined}>
            {player.name}
            <span className="sr-only">{voted.has(player.id) ? ', voted' : ', not voted yet'}</span>
          </li>
        ))}
      </ul>
    </main>
  )
}

// The TV's results for one question: a bar chart made of people's names, so everyone sees who
// voted what. Each score from 1 to 10 is a column stacking a name tag per player who gave it, in
// that score's colour; the stack's height is the count.
function ResultsScreen({ game, question }: { game: Game; question: Question }) {
  const votes = question.votes ?? []
  const names = new Map(game.players.map((p) => [p.id, p.name]))
  const columns = SCORES.map((score) => votes.filter((v) => v.score === score))
  const tallest = Math.max(1, ...columns.map((column) => column.length))
  const average = votes.length ? votes.reduce((sum, v) => sum + v.score, 0) / votes.length : null
  const connected = new Set(game.connectedPlayerIds ?? [])
  const ready = new Set(game.readyPlayerIds ?? [])
  const isLast = question.number >= question.total

  return (
    <main className="screen">
      <p className="question-number">
        Results · {question.number} of {question.total}
      </p>
      <div className="results-header">
        <QuestionImage item={question.item} className="results-image" />
        <div>
          <h1 className="question-name">{question.item.name}</h1>
          <p>
            {average === null ? (
              'Nobody voted on this one.'
            ) : (
              <>
                Average <strong>{average.toFixed(1)}</strong> from {votes.length}{' '}
                {votes.length === 1 ? 'vote' : 'votes'}
              </>
            )}
          </p>
        </div>
      </div>
      {/* --rows lets the tags shrink when one score gets a tall stack. */}
      <figure className="name-chart" style={{ '--rows': tallest } as CSSProperties}>
        <div className="name-chart-columns">
          {columns.map((column, i) => {
            const voters = column.map((v) => names.get(v.playerId) ?? 'Someone')
            return (
              <div
                key={i}
                className={`name-chart-column score-${i + 1}`}
                data-score={i + 1}
                role="group"
                aria-label={`${i + 1}: ${voters.length ? voters.join(', ') : 'nobody'}`}
              >
                {voters.map((name, j) => (
                  <span key={column[j].playerId} className="name-chart-tag" title={name}>
                    {name}
                  </span>
                ))}
              </div>
            )
          })}
        </div>
        <div className="name-chart-axis" aria-hidden="true">
          {SCORES.map((score) => (
            <span key={score}>{score}</span>
          ))}
        </div>
        <div className="scale-labels" aria-hidden="true">
          <span>Hate it</span>
          <span>Love it</span>
        </div>
      </figure>
      {isLast ? (
        <p className="tagline">That's all the results!</p>
      ) : (
        <>
          <ul className="players votes" aria-label="Ready for the next one">
            {game.players.map((player) => {
              const isReady = ready.has(player.id)
              const away = !connected.has(player.id)
              return (
                <li
                  key={player.id}
                  className={isReady ? 'voted' : away ? 'away' : undefined}
                >
                  {player.name}
                  {away && !isReady && ' · away'}
                  <span className="sr-only">{isReady ? ', ready' : ', not ready yet'}</span>
                </li>
              )
            })}
          </ul>
          <p>Tap Next on your phone when you're ready.</p>
        </>
      )}
    </main>
  )
}

// A player's phone on the results: their own score for the question being shown, and Next.
// Tapping Next can't be undone; once every connected player has, everyone moves on.
function PlayerResultsScreen({
  game,
  question,
  player,
  send,
}: {
  game: Game
  question: Question
  player: Player
  send: Send
}) {
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const myScore = question.votes?.find((v) => v.playerId === player.id)?.score ?? null
  const isReady = (game.readyPlayerIds ?? []).includes(player.id)
  const connected = game.connectedPlayerIds ?? []
  const readyCount = connected.filter((id) => game.readyPlayerIds?.includes(id)).length
  const isLast = question.number >= question.total

  async function handleNext() {
    setSending(true)
    setError(null)
    try {
      await readyForNextResult(send, game.code, player.id, question.number)
    } catch (err) {
      setError(
        err instanceof SocketError ? err.message : "Couldn't send that. Check the connection.",
      )
      setSending(false)
    }
  }

  return (
    <main className={myScore === null ? 'screen' : `screen score-${myScore}`}>
      <p className="question-number">
        Results · {question.number} of {question.total}
      </p>
      <QuestionImage item={question.item} className="results-image" />
      <h1 className="vote-name">{question.item.name}</h1>
      {myScore === null ? (
        <p>You didn't vote on this one.</p>
      ) : (
        <>
          <p>You voted</p>
          <p className="score-card">{myScore}</p>
        </>
      )}
      {isLast ? (
        <p>That's all the results! Check the TV.</p>
      ) : (
        <>
          <div className="actions">
            <button
              type="button"
              className={isReady ? 'primary done' : 'primary'}
              disabled={sending || isReady}
              onClick={handleNext}
            >
              {isReady ? 'Ready ✓' : sending ? 'Sending…' : 'Next'}
            </button>
          </div>
          <p role="status">
            {isReady
              ? `Waiting for the others… ${readyCount} of ${connected.length} ready`
              : 'Check the TV, then tap Next when you’re ready.'}
          </p>
        </>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </main>
  )
}

// The question's picture, or a placeholder for items that don't have one yet.
function QuestionImage({ item, className }: { item: Item; className?: string }) {
  const classes = className ? `question-image ${className}` : 'question-image'
  return item.imageUrl ? (
    <img className={classes} src={item.imageUrl} alt={item.name} />
  ) : (
    <div className={`${classes} placeholder`} aria-hidden="true">
      No picture yet
    </div>
  )
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="link" onClick={onClick}>
      ← Back
    </button>
  )
}

export default App
