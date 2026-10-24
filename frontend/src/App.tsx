import { type FormEvent, useEffect, useState } from 'react'
import {
  clearHostedGameCode,
  clearPlayerSeat,
  fetchGame,
  type Game,
  GameNotFoundError,
  getHostedGameCode,
  getPlayerSeat,
  JoinError,
  joinGame,
  type Player,
  type PlayerSeat,
  saveHostedGameCode,
  savePlayerSeat,
} from './game'
import { useGameSocket } from './socket'
import { BackButton } from './components/BackButton'
import { HomeScreen } from './home/HomeScreen'
import { PlayerScreen } from './phone/PlayerScreen'
import { GameScreen } from './tv/GameScreen'
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
        if (saved.as === 'host') {
          return game.nextCode ? goToNextGame(game, null) : setScreen({ name: 'game', game })
        }
        const player = game.players.find((p) => p.id === saved.seat.playerId)
        if (!player) forget()
        else if (game.nextCode) goToNextGame(game, player)
        else setScreen({ name: 'player', game, player })
      })
      .catch((err: unknown) => {
        if (err instanceof GameNotFoundError) forget()
        else setScreen({ name: 'offline', saved })
      })
  }

  // Someone tapped Back to the lobby: the game now points at a new one for the same players, so
  // follow them there. The TV switches its saved game; a phone rejoins by name, which finds the
  // seat the server already made for it.
  function goToNextGame(game: Game, player: Player | null) {
    const nextCode = game.nextCode
    if (!nextCode) return
    if (!player) {
      saveHostedGameCode(nextCode)
      const saved: SavedGame = { as: 'host', code: nextCode }
      setScreen({ name: 'restoring', saved })
      return loadSavedGame(saved)
    }
    const current: SavedGame = { as: 'player', seat: { code: game.code, playerId: player.id } }
    setScreen({ name: 'restoring', saved: current })
    joinGame(nextCode, player.name)
      .then((joined) => {
        const seat = { code: nextCode, playerId: joined.id }
        savePlayerSeat(seat)
        loadSavedGame({ as: 'player', seat })
      })
      // Retrying reloads this game, which leads here again.
      .catch(() => setScreen({ name: 'offline', saved: current }))
  }

  useEffect(() => {
    const saved = getSavedGame()
    if (saved) loadSavedGame(saved)
  }, [])

  // The TV and the phones follow their game live (players joining, the game starting, votes), and
  // phones send their actions over the same connection.
  const liveCode = screen.name === 'game' || screen.name === 'player' ? screen.game.code : null
  const livePlayerId = screen.name === 'player' ? screen.player.id : null
  const send = useGameSocket(liveCode, livePlayerId, (game) => {
    if (game.nextCode) return goToNextGame(game, screen.name === 'player' ? screen.player : null)
    setScreen((current) => {
      if (current.name === 'game') return { name: 'game', game }
      if (current.name === 'player') {
        const player = game.players.find((p) => p.id === current.player.id)
        return player ? { name: 'player', game, player } : current
      }
      return current
    })
  })

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

export default App
