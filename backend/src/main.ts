import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setGlobalPrefix('api');
  app.enableShutdownHooks();
  app.enableCors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173' });
  // In the Docker image the backend also serves the built frontend, so the whole game runs on
  // one port. In development Vite serves it instead.
  if (process.env.STATIC_DIR) app.useStaticAssets(process.env.STATIC_DIR);
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
