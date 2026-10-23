import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { DbModule } from './db/db.module.js';
import { GamesModule } from './games/games.module.js';

@Module({
  imports: [DbModule, GamesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
