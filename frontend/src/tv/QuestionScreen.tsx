import { type Player, type Question } from '../types'
import { nextQuestion, type Send } from '../socket'
import { QuestionImage } from '../components/QuestionImage'
import { useEffect } from 'react'

export function QuestionScreen({
  code,
  question,
  players,
  send,
}: {
  code: string
  question: Question
  players: Player[]
  send: Send
}) {
  const { item } = question
  const voted = new Set(question.votedPlayerIds)
  const everyoneVoted = players.length > 0 && voted.size >= players.length
  useEffect(() => {
    if (everyoneVoted === true) {
      nextQuestion(send, code, question.number).catch(() => {})
    }
  }, [everyoneVoted, send, code, question.number])
  return (
    <main className="screen">
      <p className="question-number">
        Question {question.number} of {question.total}
      </p>
      <QuestionImage item={item} />
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
