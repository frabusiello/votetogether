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
  | { name: 'lobby'; game: Game }

function App() {
  const [screen, setScreen] = useState<Screen>(() => {
    const code = getHostedGameCode()
    return code ? { name: 'restoring', code } : { name: 'home' }
  })

  // Reconnect to the game saved in the cookie. Only a 404 forgets it: a network error keeps it
  // so the TV can retry once the connection is back.
  function loadHostedGame(code: string) {
    fetchGame(code)
      .then((game) => setScreen({ name: 'lobby', game }))
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

    case 'lobby':
      return (
        <LobbyScreen
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
          onCreated={(game) => setScreen({ name: 'lobby', game })}
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

function LobbyScreen({ game, onStartOver }: { game: Game; onStartOver: () => void }) {
  return (
    <main className="screen">
      <p className="tagline">
        Go to <strong>{window.location.host}</strong> and join with the code
      </p>
      <p className="game-code" aria-label={`Game code ${game.code.split('').join(' ')}`}>
        {game.code}
      </p>
      <p>Waiting for players…</p>
      <button type="button" className="link" onClick={onStartOver}>
        Start over
      </button>
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
