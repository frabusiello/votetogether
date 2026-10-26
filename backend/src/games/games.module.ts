import { Module } from '@nestjs/common'
import { GamesController } from './games.controller.js'
import { GamesGateway } from './games.gateway.js'
import { GamesService } from './games.service.js'

@Module({
  controllers: [GamesController],
  providers: [GamesService, GamesGateway],
})
export class GamesModule {}
