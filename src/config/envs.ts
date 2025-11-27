import 'dotenv/config';
import { z } from 'zod';

const envSchema = z
    .object({
        // --- Servidor ---
        PORT: z.coerce.number().default(3000),
        NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

        // --- Base de Datos (Postgres) ---
        DATABASE_URL: z.string().min(1, 'DATABASE_URL es requerida'),

        // --- Redis (Opcional por ahora si no lo usas directamente en código) ---
        // REDIS_HOST: z.string().default('localhost'),
        // REDIS_PORT: z.coerce.number().default(6379),
    })
    .passthrough(); // Permite otras variables no definidas aquí

const envParsed = envSchema.safeParse(process.env);

if (!envParsed.success) {
    console.error('❌ Error crítico en variables de entorno:', envParsed.error.format());
    throw new Error('La configuración del entorno es inválida. Revisa el archivo .env');
}

export const envs = envParsed.data;