import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import pg from 'pg'

// Applies the migrations in ./drizzle, like `npm run db:migrate` but without drizzle-kit (a dev
// dependency), so the Docker image can bring its database up to date when it starts.
const url = process.env.VOTE_TOGETHER_PG_URL
if (!url) throw new Error('VOTE_TOGETHER_PG_URL is not set')

const pool = new pg.Pool({ connectionString: url })
try {
  await migrate(drizzle(pool), { migrationsFolder: process.env.MIGRATIONS_DIR ?? 'drizzle' })
  console.log('Migrations applied')
} finally {
  await pool.end()
}
