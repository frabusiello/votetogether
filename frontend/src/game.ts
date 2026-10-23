export type Game = {
  id: number
  code: string
  status: 'lobby' | 'playing' | 'results'
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

export class GameNotFoundError extends Error {}

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
