import { type Player, type Question } from '../types'
import { nextQuestion, type Send } from '../socket'
import { Countdown } from '../components/Countdown'
import { QuestionImage } from '../components/QuestionImage'

// Once everyone has voted, the TV counts down this long before moving on.
const NEXT_QUESTION_COUNTDOWN_MS = 5_000

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
  const isLast = question.number >= question.total
  return (
    <main className="screen">
      <p className="question-number">
        Question {question.number} of {question.total}
      </p>
      {everyoneVoted ? (
        // The TV drives the game on: when this reaches zero it asks the server for the next
        // question, which then reaches the phones too. Keyed by question so it restarts for each.
        <Countdown
          key={question.number}
          ms={NEXT_QUESTION_COUNTDOWN_MS}
          label={isLast ? "Everyone's voted! Results in" : "Everyone's voted! Next question in"}
          doneLabel={isLast ? 'Here come the results!' : 'Next question!'}
          onDone={() => nextQuestion(send, code, question.number).catch(() => {})}
        />
      ) : (
        <QuestionImage item={item} />
      )}
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
