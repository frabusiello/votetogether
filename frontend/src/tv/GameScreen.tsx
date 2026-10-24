import { type Game } from '../game'
import { type Send } from '../socket'
import { LobbyScreen } from './LobbyScreen'
import { QuestionScreen } from './QuestionScreen'
import { ResultsScreen } from './ResultsScreen'

// The shared TV screen for a game, which depends on how far along the game is.
export type GameScreenProps = { game: Game; send: Send; onStartOver: () => void }

export function GameScreen({ game, send, onStartOver }: GameScreenProps) {
  switch (game.status) {
    case 'lobby':
      return <LobbyScreen game={game} send={send} onStartOver={onStartOver} />
    case 'playing':
      return game.question ? (
        <QuestionScreen
          code={game.code}
          question={game.question}
          players={game.players}
          send={send}
        />
      ) : (
        <main className="screen">
          <p>This game has no questions.</p>
        </main>
      )
    case 'results':
      return game.question ? (
        <ResultsScreen game={game} question={game.question} />
      ) : (
        <main className="screen">
          <h1>That's a wrap!</h1>
        </main>
      )
  }
}
