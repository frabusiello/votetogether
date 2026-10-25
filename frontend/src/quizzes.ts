import { useEffect, useState } from 'react'
import type { Quiz } from './types'

type QuizzesState = { name: 'loading' } | { name: 'loaded'; quizzes: Quiz[] } | { name: 'failed' }
export function useQuizzes() {
  const [state, setState] = useState<QuizzesState>({ name: 'loading' })
  useEffect(() => {
    let ignore = false
    fetchQuizzes()
      .then((quizzes) => {
        if (!ignore) setState({ name: 'loaded', quizzes })
      })
      .catch(() => {
        if (!ignore) setState({ name: 'failed' })
      })
    return () => {
      ignore = true
    }
  }, [])
  return state
}
export async function fetchQuizzes(): Promise<Quiz[]> {
  const res = await fetch('/api/quizzes')
  if (!res.ok) throw new Error(`Couldn't fetch quizzes with ${res.status}`)
  return res.json()
}
