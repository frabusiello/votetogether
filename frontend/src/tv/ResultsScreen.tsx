import { type CSSProperties } from 'react'
import { type Game, type Question, SCORES } from '../game'
import { QuestionImage } from '../components/QuestionImage'

// The TV's results for one question: a bar chart made of people's names, so everyone sees who
// voted what. Each score from 1 to 10 is a column stacking a name tag per player who gave it, in
// that score's colour; the stack's height is the count.
export function ResultsScreen({ game, question }: { game: Game; question: Question }) {
  const votes = question.votes ?? []
  const names = new Map(game.players.map((p) => [p.id, p.name]))
  const columns = SCORES.map((score) => votes.filter((v) => v.score === score))
  const tallest = Math.max(1, ...columns.map((column) => column.length))
  const average = votes.length ? votes.reduce((sum, v) => sum + v.score, 0) / votes.length : null
  const connected = new Set(game.connectedPlayerIds ?? [])
  const ready = new Set(game.readyPlayerIds ?? [])
  const isLast = question.number >= question.total

  return (
    <main className="screen">
      <p className="question-number">
        Results · {question.number} of {question.total}
      </p>
      <div className="results-header">
        <QuestionImage item={question.item} className="results-image" />
        <div>
          <h1 className="question-name">{question.item.name}</h1>
          <p>
            {average === null ? (
              'Nobody voted on this one.'
            ) : (
              <>
                Average <strong>{average.toFixed(1)}</strong> from {votes.length}{' '}
                {votes.length === 1 ? 'vote' : 'votes'}
              </>
            )}
          </p>
        </div>
      </div>
      {/* --rows lets the tags shrink when one score gets a tall stack. */}
      <figure className="name-chart" style={{ '--rows': tallest } as CSSProperties}>
        <div className="name-chart-columns">
          {columns.map((column, i) => {
            const voters = column.map((v) => names.get(v.playerId) ?? 'Someone')
            return (
              <div
                key={i}
                className={`name-chart-column score-${i + 1}`}
                data-score={i + 1}
                role="group"
                aria-label={`${i + 1}: ${voters.length ? voters.join(', ') : 'nobody'}`}
              >
                {voters.map((name, j) => (
                  <span key={column[j].playerId} className="name-chart-tag" title={name}>
                    {name}
                  </span>
                ))}
              </div>
            )
          })}
        </div>
        <div className="name-chart-axis" aria-hidden="true">
          {SCORES.map((score) => (
            <span key={score}>{score}</span>
          ))}
        </div>
        <div className="scale-labels" aria-hidden="true">
          <span>Hate it</span>
          <span>Love it</span>
        </div>
      </figure>
      {isLast ? (
        <>
          <p className="tagline">That's all the results!</p>
          <p>Tap Back to the lobby on your phone to start a new game.</p>
        </>
      ) : (
        <>
          <ul className="players votes" aria-label="Ready for the next one">
            {game.players.map((player) => {
              const isReady = ready.has(player.id)
              const away = !connected.has(player.id)
              return (
                <li
                  key={player.id}
                  className={isReady ? 'voted' : away ? 'away' : undefined}
                >
                  {player.name}
                  {away && !isReady && ' · away'}
                  <span className="sr-only">{isReady ? ', ready' : ', not ready yet'}</span>
                </li>
              )
            })}
          </ul>
          <p>Tap Next on your phone when you're ready.</p>
        </>
      )}
    </main>
  )
}
