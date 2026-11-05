import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { minutes, ThrottlerModule } from '@nestjs/throttler'
import { AppController } from './app.controller.js'
import { AppService } from './app.service.js'
import { DbModule } from './db/db.module.js'
import { GamesModule } from './games/games.module.js'
import { HttpThrottlerGuard } from './http-throttler.guard.js'
import { QuizzesModule } from './quizzes/quizzes.module.js'

@Module({
  imports: [
    DbModule,
    GamesModule,
    QuizzesModule,
    // Requests per address per minute, across the whole API. Behind a tunnel or a home router
    // everyone can share one address, so this leaves room for a full game of 20 phones joining at
    // once; it's only there to stop a script hammering the API.
    ThrottlerModule.forRoot({ throttlers: [{ ttl: minutes(1), limit: 120 }] }),
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: HttpThrottlerGuard }],
})
export class AppModule {}
