import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import type { Game } from './game'

type WatchReply = { game: Game } | { error: string }

// Keeps a screen up to date with a game over a WebSocket while `code` is set. On every
// (re)connect it asks for the current state, so updates missed while offline aren't lost.
export function useGameUpdates(code: string | null, onUpdate: (game: Game) => void) {
  const onUpdateRef = useRef(onUpdate)
  useEffect(() => {
    onUpdateRef.current = onUpdate
  })

  useEffect(() => {
    if (!code) return
    const socket = io({ path: '/api/socket.io' })

    socket.on('connect', () => {
      socket.emit('watch', { code }, (reply: WatchReply) => {
        if ('game' in reply) onUpdateRef.current(reply.game)
      })
    })
    socket.on('game', (game: Game) => onUpdateRef.current(game))

    return () => {
      socket.disconnect()
    }
  }, [code])
}
