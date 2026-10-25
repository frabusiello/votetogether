import { useQuizzes } from '../quizzes'
import type { Send } from '../socket'
import type { Game } from '../types'
import { chooseQuiz, SocketError } from '../socket'
import { useState } from 'react'

type Status = { name: 'idle' } | { name: 'sending' } | { name: 'error'; errorMessage: string }

export function QuizSelector({ game, send }: { game: Game; send: Send }) {
  const quizzesResult = useQuizzes()
  const [status, setStatus] = useState<Status>({ name: 'idle' })
  async function choose(quizId: number) {
    setStatus({ name: 'sending' })
    try {
      await chooseQuiz(send, game.code, quizId)
      setStatus({ name: 'idle' })
    } catch (err) {
      setStatus({
        name: 'error',
        errorMessage: err instanceof SocketError ? err.message : "Couldn't change the quiz",
      })
    }
  }
  if (quizzesResult.name === 'loading') return null
  if (quizzesResult.name === 'failed')
    return (
      <div>
        <p className="error" role="alert">
          Couldn't load quizzes
        </p>
      </div>
    )
  return (
    <>
      <div className="actions" role="group" aria-label="Quiz">
        {quizzesResult.quizzes.map((quiz) => {
          const isSelected = quiz.id === game.quiz?.id
          return (
            <button
              disabled={status.name === 'sending'}
              className={isSelected ? 'primary' : 'secondary'}
              aria-pressed={isSelected}
              type="button"
              key={quiz.id}
              onClick={() => choose(quiz.id)}
            >
              {quiz.name}
            </button>
          )
        })}
      </div>
      {status.name === 'error' && (
        <p className="error" role="alert">
          {status.errorMessage}
        </p>
      )}
    </>
  )
}
