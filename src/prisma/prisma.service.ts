import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    // 1. Crear el Pool de conexiones nativo de Postgres
    const connectionString = `${process.env.DATABASE_URL}`;
    const pool = new Pool({ connectionString });

    // 2. Crear el adaptador de Prisma para Postgres
    const adapter = new PrismaPg(pool);

    // 3. Pasarle el adaptador al constructor (La forma v7)
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
