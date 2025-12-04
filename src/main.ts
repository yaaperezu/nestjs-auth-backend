import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe, Logger } from '@nestjs/common';

import { AppModule } from './app.module';
import { envs } from './config/envs';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create<NestExpressApplication>(AppModule); // Importar NestExpressApplication
  app.set('trust proxy', 1); // Confiar en el primer proxy

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Auth Backend Enterprise')
    .setDescription('API de autenticación con NestJS, Prisma y JWT')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Usamos el puerto validado
  await app.listen(envs.PORT);
  logger.log(`🚀 Server running on port ${envs.PORT}`);
}
bootstrap();