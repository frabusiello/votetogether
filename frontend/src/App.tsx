import { type FormEvent, useEffect, useState } from 'react'
import {
  castVote,
  clearHostedGameCode,
  clearPlayerSeat,
  createGame,
  fetchGame,
  type Game,
  GameNotFoundError,
  getHostedGameCode,
  getPlayerSeat,
  JoinError,
  joinGame,
  type Player,
  type PlayerSeat,
  type Question,
  saveHostedGameCode,
  savePlayerSeat,
  VoteError,
} from './game'
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

type PlayerScreenProps = { game: Game; player: Player; onLeave: () => void }

// A player's phone screen for a game, which depends on how far along the game is.
function PlayerScreen(props: PlayerScreenProps) {
  const { game, player } = props
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

function VoteScreen({
  code,
  player,
  question,
}: {
  code: string
  player: Player
  question: Question
}) {
  // The score this phone sent. After a refresh it's unknown, but the server still says they voted.
  const [score, setScore] = useState<number | null>(null)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const voted = score !== null || question.votedPlayerIds.includes(player.id)

  async function handleVote(value: number) {
    setSending(true)
    setError(null)
    try {
      const vote = await castVote(code, player.id, value)
      setScore(vote.score)
    } catch (err) {
      setError(
        err instanceof VoteError
          ? err.message
          : "Couldn't send your vote. Check the connection and try again.",
      )
    } finally {
      setSending(false)
    }
  }

  return (
    <main className="screen">
      <p className="question-number">
        Question {question.number} of {question.total}
      </p>
      <h1 className="vote-name">{question.item.name}</h1>
      <div className="scale" role="group" aria-label="Your score from 1 to 10">
        {SCORES.map((value) => (
          <button
            key={value}
            type="button"
            className={value === score ? 'selected' : undefined}
            aria-pressed={value === score}
            disabled={sending}
            onClick={() => handleVote(value)}
          >
            {value}
          </button>
        ))}
      </div>
      <div className="scale-labels" aria-hidden="true">
        <span>Hate it</span>
        <span>Love it</span>
      </div>
      <p role="status">
        {score !== null
          ? `You voted ${score}. Tap another number to change it.`
          : voted
            ? 'Your vote is in. Tap a number to change it.'
            : 'Tap a number to vote.'}
      </p>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </main>
  )
}

function PlayerLobbyScreen({ game, player, onLeave }: PlayerScreenProps) {
  return (
    <main className="screen">
      <h1>You're in, {player.name}!</h1>
      <p>
        Game <strong>{game.code}</strong>
        {game.category && <> · {game.category.name}</>}
      </p>
      <p>Waiting for the game to start…</p>
      <button type="button" className="link" onClick={onLeave}>
        Leave
      </button>
    </main>
  )
}

// The shared TV screen for a game, which depends on how far along the game is.
function GameScreen({ game, onStartOver }: { game: Game; onStartOver: () => void }) {
  switch (game.status) {
    case 'lobby':
      return <LobbyScreen game={game} onStartOver={onStartOver} />
    case 'playing':
      return game.question ? (
        <QuestionScreen question={game.question} />
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
  return (
    <main className="screen">
      <p className="tagline">
        Go to <strong>{window.location.host}</strong> and join with the code
      </p>
      <p className="game-code" aria-label={`Game code ${game.code.split('').join(' ')}`}>
        {game.code}
      </p>
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

function QuestionScreen({ question }: { question: Question }) {
  const { item } = question
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
      <p>Vote 1–10 on your phone.</p>
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
