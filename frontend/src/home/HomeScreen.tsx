import { useState } from 'react'
import { createGame, type Game, saveHostedGameCode } from '../game'

export function HomeScreen({
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
