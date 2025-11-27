import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
// Nueva ruta de Prisma
import { PrismaModule } from './providers/prisma/prisma.module';

@Module({
  imports: [
    // Mantenemos ConfigModule para compatibilidad global, pero la validación fuerte es en envs.ts
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }