import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // <--- ¡Esto es clave!
@Module({
  providers: [PrismaService],
  exports: [PrismaService], // Exportamos el servicio para que otros lo usen
})
export class PrismaModule {}
