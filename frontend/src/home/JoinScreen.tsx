import { type FormEvent, useState } from 'react'
import { JoinError, joinGame, type PlayerSeat, savePlayerSeat } from '../game'
import { BackButton } from '../components/BackButton'

export function JoinScreen({
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
