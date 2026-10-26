import { Global, Inject, Module, OnApplicationShutdown } from '@nestjs/common'
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import * as schema from './schema.js'

export const DB = Symbol('DB')
export type Db = NodePgDatabase<typeof schema>

const PG_POOL = Symbol('PG_POOL')

@Global()
@Module({
  providers: [
    {
      provide: PG_POOL,
      // Connection string lives in the shell env, never in the repo.
      useFactory: () => {
        const url = process.env.VOTE_TOGETHER_PG_URL
        if (!url) throw new Error('VOTE_TOGETHER_PG_URL is not set')
        return new pg.Pool({ connectionString: url })
      },
    },
    {
      provide: DB,
      inject: [PG_POOL],
      useFactory: (pool: pg.Pool): Db => drizzle(pool, { schema }),
    },
  ],
  exports: [DB],
})
export class DbModule implements OnApplicationShutdown {
  constructor(@Inject(PG_POOL) private readonly pool: pg.Pool) {}

  async onApplicationShutdown() {
    await this.pool.end()
  }
}
