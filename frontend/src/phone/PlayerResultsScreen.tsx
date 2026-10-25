import { useState } from 'react'
import { type Game, type Player, type Question } from '../types'
import { backToLobby, readyForNextResult, type Send, SocketError } from '../socket'
import { QuestionImage } from '../components/QuestionImage'

// A player's phone on the results: their own score for the question being shown, and Next.
// Tapping Next can't be undone; once every connected player has, everyone moves on. On the last
// question, Back to the lobby moves everyone on to a new game.
export function PlayerResultsScreen({
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

  async function handleSend(action: () => Promise<void>) {
    setSending(true)
    setError(null)
    try {
      await action()
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
        <>
          <div className="actions">
            <button
              type="button"
              className="primary"
              disabled={sending}
              onClick={() => handleSend(() => backToLobby(send, game.code, player.id))}
            >
              {sending ? 'Sending…' : 'Back to the lobby'}
            </button>
          </div>
          <p>That's all the results! Head back to the lobby to start a new game.</p>
        </>
      ) : (
        <>
          <div className="actions">
            <button
              type="button"
              className={isReady ? 'primary done' : 'primary'}
              disabled={sending || isReady}
              onClick={() =>
                handleSend(() => readyForNextResult(send, game.code, player.id, question.number))
              }
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
