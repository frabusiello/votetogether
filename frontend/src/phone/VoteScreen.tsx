import { useState } from 'react'
import { getSavedVote, saveVote } from '../game'
import { type Player, type Question, SCORES } from '../types'
import { castVote, type Send, SocketError } from '../socket'

const STARTING_SCORE = 5

export function VoteScreen({
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
