import { useEffect, useState } from 'react'
import {
  clearHostedGameCode,
  createGame,
  fetchGame,
  type Game,
  GameNotFoundError,
  getHostedGameCode,
  saveHostedGameCode,
} from './game'
import './App.css'

type Screen =
  | { name: 'home' }
  | { name: 'join' }
  | { name: 'restoring'; code: string }
  | { name: 'offline'; code: string }
  | { name: 'game'; game: Game }

function App() {
  const [screen, setScreen] = useState<Screen>(() => {
    const code = getHostedGameCode()
    return code ? { name: 'restoring', code } : { name: 'home' }
  })

  // Reconnect to the game saved in the cookie. Only a 404 forgets it: a network error keeps it
  // so the TV can retry once the connection is back.
  function loadHostedGame(code: string) {
    fetchGame(code)
      .then((game) => setScreen({ name: 'game', game }))
      .catch((err: unknown) => {
        if (err instanceof GameNotFoundError) {
          clearHostedGameCode()
          setScreen({ name: 'home' })
        } else {
          setScreen({ name: 'offline', code })
        }
      })
  }

  useEffect(() => {
    const code = getHostedGameCode()
    if (code) loadHostedGame(code)
  }, [])

  switch (screen.name) {
    case 'restoring':
      return (
        <main className="screen">
          <p>Reconnecting to game {screen.code}…</p>
        </main>
      )

    case 'offline':
      return (
        <main className="screen">
          <h1>Can't reach the server</h1>
          <p>Your game {screen.code} is saved. Check the connection and try again.</p>
          <div className="actions">
            <button
              type="button"
              className="primary"
              onClick={() => {
                setScreen({ name: 'restoring', code: screen.code })
                loadHostedGame(screen.code)
              }}
            >
              Retry
            </button>
          </div>
        </main>
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
        <main className="screen">
          <h1>Join a game</h1>
          <p>Joining with a code is coming soon.</p>
          <BackButton onClick={() => setScreen({ name: 'home' })} />
        </main>
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

function QuestionScreen({ question }: { question: NonNullable<Game['question']> }) {
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
