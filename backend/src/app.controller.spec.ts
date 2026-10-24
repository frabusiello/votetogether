import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('config', () => {
    afterEach(() => {
      delete process.env.PUBLIC_URL;
    });

    it('returns PUBLIC_URL as the address players join at, when set', () => {
      process.env.PUBLIC_URL = ' https://votetogether.example.com ';
      expect(appController.getConfig().publicUrl).toBe('https://votetogether.example.com');
    });

    it('has no public URL when PUBLIC_URL is unset or blank', () => {
      expect(appController.getConfig().publicUrl).toBeNull();
      process.env.PUBLIC_URL = '  ';
      expect(appController.getConfig().publicUrl).toBeNull();
    });
  });
});
