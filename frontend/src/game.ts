export type Player = { id: number; name: string }

export type Item = { id: number; name: string; imageUrl: string | null }

export type Game = {
  id: number
  code: string
  status: 'lobby' | 'playing' | 'results'
  category: { name: string } | null
  // While the lobby counts down to the first question, how long is left. Only sent over the
  // socket; null or missing otherwise.
  startingInMs?: number | null
  // Also socket-only: the players with a phone connected, and on the results who has tapped Next.
  connectedPlayerIds?: number[]
  readyPlayerIds?: number[]
  players: Player[]
  question: Question | null
}

export type Question = {
  number: number
  total: number
  item: Item
  // Who has voted on this question so far. Scores stay hidden until the results.
  votedPlayerIds: number[]
  // Each player's score, only once the game is showing the results.
  votes: { playerId: number; score: number }[] | null
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
  const res = await postJson(`/api/games/${encodeURIComponent(code)}/players`, { name })
  if ([400, 404, 409].includes(res.status)) {
    throw new JoinError(await errorMessage(res, "Couldn't join that game"))
  }
  if (!res.ok) throw new Error(`Joining game ${code} failed with ${res.status}`)
  return res.json()
}

// The score this device last sent for a question, so the slider can show it after a refresh.
// Only a convenience: the server holds the real vote, and storage may be unavailable.
type VoteKey = { code: string; playerId: number; questionNumber: number }

const voteStorageKey = ({ code, playerId, questionNumber }: VoteKey) =>
  `vt_vote:${code}:${playerId}:${questionNumber}`

export function getSavedVote(key: VoteKey): number | null {
  try {
    const score = Number(localStorage.getItem(voteStorageKey(key)))
    return Number.isInteger(score) && score >= 1 && score <= 10 ? score : null
  } catch {
    return null
  }
}

export function saveVote(key: VoteKey, score: number) {
  try {
    localStorage.setItem(voteStorageKey(key), String(score))
  } catch {
    // Storage blocked: the vote still counts, the slider just won't remember it.
  }
}

function postJson(url: string, body: unknown) {
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

async function errorMessage(res: Response, fallback: string) {
  const body: { message?: string } = await res.json().catch(() => ({}))
  return body.message ?? fallback
}

// From the server: PUBLIC_URL when it's set, and its local network IP when it can tell (not inside
// Docker). Used to show players where to join.
export type ServerConfig = { publicUrl: string | null; lanAddress: string | null }

export async function fetchServerConfig(): Promise<ServerConfig> {
  const res = await fetch('/api/config')
  if (!res.ok) throw new Error(`Loading the server config failed with ${res.status}`)
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
