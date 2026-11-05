import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { fetchServerConfig, joinLink, type ServerConfig } from '../game'
import { StartCountdown } from '../components/Countdown'
import { type GameScreenProps } from './GameScreen'
import { QuizSelector } from '../components/QuizSelector'
// Where players should go to join, as shown on the TV and in the QR code:
// 1. PUBLIC_URL, when the server has one set (a domain, or a NAS's fixed name or IP).
// 2. Otherwise the address the TV was opened with, e.g. http://192.168.1.20:5174 on a home server.
// 3. Except when the TV is on the server itself via localhost, which phones can't reach: then the
//    server's local network IP, on the same port.
function useJoinUrl() {
  const [config, setConfig] = useState<ServerConfig | null>(null)
  useEffect(() => {
    fetchServerConfig()
      .then(setConfig)
      .catch(() => {})
  }, [])

  const publicUrl = config?.publicUrl && URL.parse(config.publicUrl)
  if (publicUrl) return publicUrl
  const url = new URL(window.location.origin)
  if (['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) && config?.lanAddress) {
    url.hostname = config.lanAddress
  }
  return url
}

export function LobbyScreen({ game, send, onStartOver }: GameScreenProps) {
  const joinUrl = useJoinUrl()
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
      <div className="join-info">
        <div className="join-code">
          <p className="tagline">
            Scan to join, or go to <strong>{joinUrl.host}</strong> and enter the code
          </p>
          <div
            className="game-code"
            role="img"
            aria-label={`Game code ${game.code.split('').join(' ')}`}
          >
            {game.code.split('').map((letter, i) => (
              <span key={i}>{letter}</span>
            ))}
          </div>
        </div>
        {/* Opens the join screen with the code already filled in. Dark on cream in both colour
            modes: some phone cameras can't read a light-on-dark code. */}
        <QRCodeSVG
          className="join-qr"
          value={joinLink(joinUrl, game.code)}
          size={200}
          marginSize={2}
          fgColor="#3a2a20"
          bgColor="#fffad3"
          title="Scan to join this game"
        />
      </div>
      <QuizSelector game={game} send={send} />
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
