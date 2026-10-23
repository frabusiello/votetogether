export type Player = { id: number; name: string }

export type Item = { id: number; name: string; imageUrl: string | null }

export type Game = {
  id: number
  code: string
  status: 'lobby' | 'playing' | 'results'
  category: { name: string } | null
  players: Player[]
  question: { number: number; total: number; item: Item } | null
}

// The game this browser is hosting, so the TV can get back to it after a refresh or a dropped
// connection. It holds just the code until there are accounts.
const HOSTED_GAME_COOKIE = 'vt_hosted_game'
const COOKIE_MAX_AGE = 60 * 60 * 12

export function getHostedGameCode(): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${HOSTED_GAME_COOKIE}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

export function saveHostedGameCode(code: string) {
  document.cookie = `${HOSTED_GAME_COOKIE}=${encodeURIComponent(code)}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`
}

export function clearHostedGameCode() {
  document.cookie = `${HOSTED_GAME_COOKIE}=; path=/; max-age=0; SameSite=Lax`
}

// The player this browser joined a game as. Kept apart from the hosted game so a TV and a player
// can be tested in one browser. Stored as CODE:PLAYER_ID.
const PLAYER_COOKIE = 'vt_player'

export type PlayerSeat = { code: string; playerId: number }

export function getPlayerSeat(): PlayerSeat | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${PLAYER_COOKIE}=([^;]*)`))
  if (!match) return null
  const [code, id] = decodeURIComponent(match[1]).split(':')
  const playerId = Number(id)
  return code && Number.isInteger(playerId) ? { code, playerId } : null
}

export function savePlayerSeat({ code, playerId }: PlayerSeat) {
  document.cookie = `${PLAYER_COOKIE}=${encodeURIComponent(`${code}:${playerId}`)}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`
}

export function clearPlayerSeat() {
  document.cookie = `${PLAYER_COOKIE}=; path=/; max-age=0; SameSite=Lax`
}

export class GameNotFoundError extends Error {}

// A join the server refused (bad name, unknown code, name taken, game started), with its reason.
export class JoinError extends Error {}

export async function joinGame(code: string, name: string): Promise<Player> {
  const res = await fetch(`/api/games/${encodeURIComponent(code)}/players`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })
  if ([400, 404, 409].includes(res.status)) {
    const body: { message?: string } = await res.json().catch(() => ({}))
    throw new JoinError(body.message ?? "Couldn't join that game")
  }
  if (!res.ok) throw new Error(`Joining game ${code} failed with ${res.status}`)
  return res.json()
}

export async function createGame(): Promise<Game> {
  const res = await fetch('/api/games', { method: 'POST' })
  if (!res.ok) throw new Error(`Creating a game failed with ${res.status}`)
  return res.json()
}

export async function fetchGame(code: string): Promise<Game> {
  const res = await fetch(`/api/games/${encodeURIComponent(code)}`)
  if (res.status === 404) throw new GameNotFoundError(`No game with code ${code}`)
  if (!res.ok) throw new Error(`Loading game ${code} failed with ${res.status}`)
  return res.json()
}
