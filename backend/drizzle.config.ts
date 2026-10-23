import { defineConfig } from 'drizzle-kit';

// Credentials come from the standard libpq env vars (PGUSER, PGPASSWORD, ...)
// so nothing secret lives in the repo.
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
  dbCredentials: {
    host: process.env.PGHOST ?? 'localhost',
    port: Number(process.env.PGPORT ?? 5432),
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE ?? 'vote_together',
    ssl: false,
  },
});
