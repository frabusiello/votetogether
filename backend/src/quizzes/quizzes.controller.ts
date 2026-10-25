import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { QuizzesService } from './quizzes.service.js';

@Controller('quizzes')
export class QuizzesController {
  constructor(private readonly quizzes: QuizzesService) {}

  @Get()
  find() {
    return this.quizzes.getAll();
  }
}
