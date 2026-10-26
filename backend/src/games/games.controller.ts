import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { GamesGateway } from './games.gateway.js'
import { GamesService } from './games.service.js'

@Controller('games')
export class GamesController {
  constructor(
    private readonly games: GamesService,
    private readonly gateway: GamesGateway,
  ) {}

  @Post()
  create() {
    return this.games.create()
  }

  @Get(':code')
  findOne(@Param('code') code: string) {
    return this.games.getState(code)
  }

  @Post(':code/players')
  async join(@Param('code') code: string, @Body('name') name: unknown) {
    const { player, created } = await this.games.join(code, name, {
      startingSoon: this.gateway.isStartingSoon(code),
    })
    // Let the screens show the new player. A rejoin doesn't change the game, so there's nothing to send.
    if (created) this.gateway.broadcastState(await this.games.getState(code))
    return player
  }
}
