import { type Game, type Player } from '../game'
import { type Send } from '../socket'
import { PlayerLobbyScreen } from './PlayerLobbyScreen'
import { PlayerResultsScreen } from './PlayerResultsScreen'
import { VoteScreen } from './VoteScreen'

export type PlayerScreenProps = { game: Game; player: Player; send: Send; onLeave: () => void }

// A player's phone screen for a game, which depends on how far along the game is.
export function PlayerScreen(props: PlayerScreenProps) {
  const { game, player, send } = props
  switch (game.status) {
    case 'lobby':
      return <PlayerLobbyScreen {...props} />
    case 'playing':
      return game.question ? (
        // Keyed by question so the picked score resets when the question changes.
        <VoteScreen
          key={game.question.number}
          code={game.code}
          player={player}
          question={game.question}
          playerCount={game.players.length}
          send={send}
        />
      ) : (
        <main className="screen">
          <p>This game has no questions.</p>
        </main>
      )
    case 'results':
      return game.question ? (
        <PlayerResultsScreen
          key={game.question.number}
          game={game}
          question={game.question}
          player={player}
          send={send}
        />
      ) : (
        <main className="screen">
          <h1>That's a wrap!</h1>
          <p>Check the TV to see how everyone voted.</p>
        </main>
      )
  }
}
