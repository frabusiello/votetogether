export type Player = { id: number; name: string }

export type Item = {
  id: number
  name: string
  imageUrl: string | null
  imageAuthor: string | null
  imageLicence: string | null
  imageSourceUrl: string | null
}
// The 1–10 scale players vote on.

export const SCORES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

export type Game = {
  id: number
  code: string
  status: 'lobby' | 'playing' | 'results'
  quiz: Quiz | null
  // While the lobby counts down to the first question, how long is left. Only sent over the
  // socket; null or missing otherwise.
  startingInMs?: number | null
  // Also socket-only: the players with a phone connected, and on the results who has tapped Next.
  connectedPlayerIds?: number[]
  readyPlayerIds?: number[]
  players: Player[]
  // Set once someone taps Back to the lobby after the results: the new game everyone moved on to.
  nextCode?: string | null
  question: Question | null
}

export type Quiz = {
  id: number
  name: string
  numQuestions: number
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
