import { useCallback, useEffect, useRef } from 'react'
import { io, type Socket } from 'socket.io-client'
import type { Game } from './game'

type Reply<T> = T | { error: string }

// A request the server refused (game already started, voting closed...), with its reason.
export class SocketError extends Error {}

export type Send = <T>(event: string, payload: object) => Promise<T>

const ACK_TIMEOUT_MS = 5000

// The live connection to a game while `code` is set: keeps the screen up to date with the game
// and returns `send` for actions. On every (re)connect it asks for the current state, so updates
// missed while offline aren't lost.
export function useGameSocket(code: string | null, onUpdate: (game: Game) => void): Send {
  const onUpdateRef = useRef(onUpdate)
  useEffect(() => {
    onUpdateRef.current = onUpdate
  })
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (!code) return
    const socket = io({ path: '/api/socket.io' })
    socketRef.current = socket

    socket.on('connect', () => {
      socket.emit('watch', { code }, (reply: Reply<{ game: Game }>) => {
        if ('game' in reply) onUpdateRef.current(reply.game)
      })
    })
    socket.on('game', (game: Game) => onUpdateRef.current(game))

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [code])

  return useCallback(async <T,>(event: string, payload: object): Promise<T> => {
    const socket = socketRef.current
    if (!socket?.connected) throw new Error("Can't reach the game")
    let reply: Reply<T>
    try {
      reply = await socket.timeout(ACK_TIMEOUT_MS).emitWithAck(event, payload)
    } catch {
      throw new Error("Can't reach the game")
    }
    if (reply && typeof reply === 'object' && 'error' in reply) throw new SocketError(reply.error)
    return reply as T
  }, [])
}

export async function startGame(send: Send, code: string, playerId: number) {
  const { game } = await send<{ game: Game }>('start', { code, playerId })
  return game
}

export async function cancelStart(send: Send, code: string, playerId: number) {
  const { game } = await send<{ game: Game }>('cancelStart', { code, playerId })
  return game
}

export async function castVote(send: Send, code: string, playerId: number, score: number) {
  const { vote } = await send<{ vote: { itemId: number; score: number } }>('vote', {
    code,
    playerId,
    score,
  })
  return vote
}
