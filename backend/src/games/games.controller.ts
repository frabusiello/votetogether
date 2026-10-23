import { Controller, Get, Param, Post } from '@nestjs/common';
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
}
