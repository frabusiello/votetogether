import { useCallback, useEffect, useRef } from 'react'
import { io, type Socket } from 'socket.io-client'
import type { Game } from './types'

type Reply<T> = T | { error: string }

// A request the server refused (game already started, voting closed...), with its reason.
export class SocketError extends Error {}

export type Send = <T>(event: string, payload: object) => Promise<T>

const ACK_TIMEOUT_MS = 5000

// The live connection to a game while `code` is set: keeps the screen up to date with the game
// and returns `send` for actions. On every (re)connect it asks for the current state, so updates
// missed while offline aren't lost.
// Phones pass their `playerId`, so the server knows who's connected; the TV passes null.
export function useGameSocket(
  code: string | null,
  playerId: number | null,
  onUpdate: (game: Game) => void,
): Send {
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
      socket.emit('watch', { code, playerId }, (reply: Reply<{ game: Game }>) => {
        if ('game' in reply) onUpdateRef.current(reply.game)
      })
    })
    socket.on('game', (game: Game) => onUpdateRef.current(game))

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [code, playerId])

  return useCallback(async <T>(event: string, payload: object): Promise<T> => {
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
  const { game } = await send<{ game: Game }>('cancelStart', {
    code,
    playerId,
  })
  return game
}

// Sent when this screen's start countdown reaches zero. Several screens send it; only the first
// counts, and the game arrives over the socket either way.
export async function beginGame(send: Send, code: string) {
  await send('begin', { code })
}

// Sent by the TV when the countdown after everyone has voted reaches zero.
export async function nextQuestion(send: Send, code: string, questionNumber: number) {
  await send('next', { code, questionNumber })
}

// On the results, this player is ready to move on from question `questionNumber`. Can't be undone;
// once every connected player has tapped it, the server moves everyone on.
export async function readyForNextResult(
  send: Send,
  code: string,
  playerId: number,
  questionNumber: number,
) {
  await send('next-result', { code, playerId, questionNumber })
}

// On the last result, starts a new game for the same players; every screen follows its nextCode.
export async function backToLobby(send: Send, code: string, playerId: number) {
  await send('back-to-lobby', { code, playerId })
}

export async function castVote(send: Send, code: string, playerId: number, score: number) {
  const { vote } = await send<{ vote: { itemId: number; score: number } }>('vote', {
    code,
    playerId,
    score,
  })
  return vote
}
