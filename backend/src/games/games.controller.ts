import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { GamesService } from './games.service.js';

@Controller('games')
export class GamesController {
  constructor(private readonly games: GamesService) {}

  @Post()
  create() {
    return this.games.create();
  }

  @Get(':code')
  findOne(@Param('code') code: string) {
    return this.games.getState(code);
  }

  @Post(':code/players')
  join(@Param('code') code: string, @Body('name') name: unknown) {
    return this.games.join(code, name);
  }

  @Post(':code/votes')
  vote(
    @Param('code') code: string,
    @Body('playerId') playerId: unknown,
    @Body('score') score: unknown,
  ) {
    return this.games.vote(code, playerId, score);
  }
}
