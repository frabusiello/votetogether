import { useEffect, useRef, useState } from 'react'
import { beginGame, type Send } from '../socket'

// Counts down to the first question. The server sends the time left rather than a clock time, so
// the deadline is set from this device's clock when the update arrives; key it by `ms` so each
// update resyncs it.
// Countdowns run here on the screens, not on the server: when one reaches zero, `onDone` tells
// the server to move the game on.
export function Countdown({
  ms,
  label,
  doneLabel,
  onDone,
}: {
  ms: number
  label: string
  doneLabel: string
  onDone: () => void
}) {
  const [deadline] = useState(() => Date.now() + ms)
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 200)
    return () => clearInterval(timer)
  }, [])

  const seconds = Math.max(0, Math.ceil((deadline - now) / 1000))
  const onDoneRef = useRef(onDone)
  useEffect(() => {
    onDoneRef.current = onDone
  })
  const done = seconds === 0
  useEffect(() => {
    if (done) onDoneRef.current()
  }, [done])

  return (
    <div className="countdown" role="timer" aria-live="polite">
      <p className="countdown-label">{done ? doneLabel : label}</p>
      <p className="score-card" aria-label={`${seconds} seconds`}>
        {seconds}
      </p>
    </div>
  )
}

// The countdown after someone presses Start. Every screen sends `begin` when it reaches zero; the
// server only acts on the first. Keyed by `ms` so each update from the server resyncs it.
export function StartCountdown({ ms, code, send }: { ms: number; code: string; send: Send }) {
  return (
    <Countdown
      key={ms}
      ms={ms}
      label="Starting in"
      doneLabel="Here we go!"
      onDone={() => beginGame(send, code).catch(() => {})}
    />
  )
}
