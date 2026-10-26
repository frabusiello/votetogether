import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import { items, quizzes } from './schema.js'

const seed: Record<string, { name: string; items: string[] }> = {
  'pizza-toppings': {
    name: 'Pizza toppings',
    items: ['Pineapple', 'Anchovies', 'Mushrooms', 'Pepperoni', 'Olives', 'Jalapeños'],
  },
  foods: {
    name: 'Foods',
    items: ['Cheese', 'Sushi', 'Brussels sprouts', 'Tacos', 'Liquorice', 'Avocado'],
  },
  movies: {
    name: 'Movies',
    items: ['The Matrix', 'Titanic', 'Shrek', 'The Godfather', 'Mamma Mia!', 'Jurassic Park'],
  },
  actors: {
    name: 'Actors',
    items: ['Tom Hanks', 'Meryl Streep', 'Nicolas Cage', 'Keanu Reeves', 'Zendaya', 'Jim Carrey'],
  },
}

const url = process.env.VOTE_TOGETHER_PG_URL
if (!url) throw new Error('VOTE_TOGETHER_PG_URL is not set')

const pool = new pg.Pool({ connectionString: url })
const db = drizzle(pool)

try {
  for (const [slug, quiz] of Object.entries(seed)) {
    const [inserted] = await db
      .insert(quizzes)
      .values({ slug, name: quiz.name })
      .onConflictDoNothing({ target: quizzes.slug })
      .returning({ id: quizzes.id })

    // Quiz already existed: leave its items alone so re-running is safe.
    if (!inserted) continue

    await db.insert(items).values(quiz.items.map((name) => ({ quizId: inserted.id, name })))
    console.log(`Seeded ${quiz.name} (${quiz.items.length} items)`)
  }
} finally {
  await pool.end()
}
