import { useState } from 'react'
import { cancelStart, SocketError, startGame } from '../socket'
import { StartCountdown } from '../components/Countdown'
import { type PlayerScreenProps } from './PlayerScreen'
import { QuizSelector } from '../components/QuizSelector'

export function PlayerLobbyScreen({ game, player, send, onLeave }: PlayerScreenProps) {
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
        {game.quiz && <> · {game.quiz.name}</>} ·{' '}
        <strong>
          {count} {count === 1 ? 'player' : 'players'} in
        </strong>
      </p>
      <QuizSelector game={game} send={send} />

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
