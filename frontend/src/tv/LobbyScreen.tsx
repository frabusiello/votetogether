import { useEffect, useState } from 'react'
import { fetchServerConfig, type ServerConfig } from '../game'
import { StartCountdown } from '../components/Countdown'
import { type GameScreenProps } from './GameScreen'

// Where players should go to join, as shown on the TV:
// 1. PUBLIC_URL, when the server has one set (a domain, or a NAS's fixed name or IP).
// 2. Otherwise the address the TV was opened with, e.g. http://192.168.1.20:5174 on a home server.
// 3. Except when the TV is on the server itself via localhost, which phones can't reach: then the
//    server's local network IP, on the same port.
function useJoinAddress() {
  const [config, setConfig] = useState<ServerConfig | null>(null)
  useEffect(() => {
    fetchServerConfig()
      .then(setConfig)
      .catch(() => {})
  }, [])

  const { hostname, host, port } = window.location
  if (config?.publicUrl) return config.publicUrl.replace(/^https?:\/\//, '').replace(/\/+$/, '')
  const onThisMachine = ['localhost', '127.0.0.1', '[::1]'].includes(hostname)
  if (onThisMachine && config?.lanAddress) {
    return port ? `${config.lanAddress}:${port}` : config.lanAddress
  }
  return host
}

export function LobbyScreen({ game, send, onStartOver }: GameScreenProps) {
  const joinAddress = useJoinAddress()
  // Once someone presses Start, joining is closed, so the code gives way to the countdown.
  if (game.startingInMs != null) {
    return (
      <main className="screen">
        <StartCountdown ms={game.startingInMs} code={game.code} send={send} />
        <ul className="players" aria-label="Players">
          {game.players.map((player) => (
            <li key={player.id}>{player.name}</li>
          ))}
        </ul>
        <p className="tagline">Someone missing? Cancel from any phone.</p>
      </main>
    )
  }

  return (
    <main className="screen">
      <p className="tagline">
        Go to <strong>{joinAddress}</strong> and join with the code
      </p>
      <div className="game-code" role="img" aria-label={`Game code ${game.code.split('').join(' ')}`}>
        {game.code.split('').map((letter, i) => (
          <span key={i}>{letter}</span>
        ))}
      </div>
      {game.category && (
        <p>
          Tonight: <strong>{game.category.name}</strong>
        </p>
      )}
      {game.players.length > 0 ? (
        <ul className="players" aria-label="Players">
          {game.players.map((player) => (
            <li key={player.id}>{player.name}</li>
          ))}
        </ul>
      ) : (
        <p>Waiting for players…</p>
      )}
      <button type="button" className="link" onClick={onStartOver}>
        Start over
      </button>
    </main>
  )
}
