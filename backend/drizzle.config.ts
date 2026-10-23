import { defineConfig } from 'drizzle-kit';

// The connection string comes from the shell env so nothing secret lives in the repo.
const url = process.env.VOTE_TOGETHER_PG_URL;
if (!url) throw new Error('VOTE_TOGETHER_PG_URL is not set');

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
  dbCredentials: { url },
});
