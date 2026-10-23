import { type FormEvent, useEffect, useState } from 'react'
import {
  clearHostedGameCode,
  clearPlayerSeat,
  createGame,
  fetchGame,
  type Game,
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
} from './game'
import { cancelStart, castVote, type Send, SocketError, startGame, useGameSocket } from './socket'
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
  const send = useGameSocket(liveCode, (game) =>
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
          send={send}
        />
      ) : (
        <main className="screen">
          <p>This game has no questions.</p>
        </main>
      )
    case 'results':
      return (
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
  send,
}: {
  code: string
  player: Player
  question: Question
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
    <main className="screen">
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
        {votedScore !== null
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
  if (game.startingInMs !== null) {
    return (
      <main className="screen">
        <Countdown key={game.startingInMs} ms={game.startingInMs} />
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
function Countdown({ ms }: { ms: number }) {
  const [deadline] = useState(() => Date.now() + ms)
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 200)
    return () => clearInterval(timer)
  }, [])

  const seconds = Math.max(0, Math.ceil((deadline - now) / 1000))
  return (
    <div className="countdown" role="timer" aria-live="polite">
      <p className="countdown-label">{seconds > 0 ? 'Starting in' : 'Here we go!'}</p>
      <p className="score-card" aria-label={`${seconds} seconds`}>
        {seconds}
      </p>
    </div>
  )
}

// The shared TV screen for a game, which depends on how far along the game is.
function GameScreen({ game, onStartOver }: { game: Game; onStartOver: () => void }) {
  switch (game.status) {
    case 'lobby':
      return <LobbyScreen game={game} onStartOver={onStartOver} />
    case 'playing':
      return game.question ? (
        <QuestionScreen question={game.question} players={game.players} />
      ) : (
        <main className="screen">
          <p>This game has no questions.</p>
        </main>
      )
    case 'results':
      return (
        <main className="screen">
          <h1>Results</h1>
          <p>Results are coming soon.</p>
        </main>
      )
  }
}

function LobbyScreen({ game, onStartOver }: { game: Game; onStartOver: () => void }) {
  // Once someone presses Start, joining is closed, so the code gives way to the countdown.
  if (game.startingInMs !== null) {
    return (
      <main className="screen">
        <Countdown key={game.startingInMs} ms={game.startingInMs} />
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
        Go to <strong>{window.location.host}</strong> and join with the code
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

function QuestionScreen({ question, players }: { question: Question; players: Player[] }) {
  const { item } = question
  const voted = new Set(question.votedPlayerIds)
  return (
    <main className="screen">
      <p className="question-number">
        Question {question.number} of {question.total}
      </p>
      {item.imageUrl ? (
        <img className="question-image" src={item.imageUrl} alt={item.name} />
      ) : (
        <div className="question-image placeholder" aria-hidden="true">
          No picture yet
        </div>
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

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="link" onClick={onClick}>
      ← Back
    </button>
  )
}

export default App
