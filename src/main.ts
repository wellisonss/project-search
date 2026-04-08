import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express'; // <-- 1. Adicione esta importação

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors();

  // <-- 2. Adicione estas duas linhas para aumentar o limite para 50MB
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  await app.listen(process.env.PORT ?? 4448);
}
bootstrap();