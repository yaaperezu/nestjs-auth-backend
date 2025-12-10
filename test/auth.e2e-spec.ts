import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/providers/prisma/prisma.service';

describe('AuthModule (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;

    // Variables para persistir datos entre tests
    let accessToken: string;
    let refreshToken: string;
    const testUser = {
        email: 'test_e2e@example.com',
        password: 'password123',
        name: 'Test E2E User',
    };

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();

        app.setGlobalPrefix('api/v1');

        // Configuración igual a main.ts para que los DTOs funcionen
        app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));

        await app.init();

        // Limpieza de DB: Borramos usuarios previos para evitar conflictos
        prisma = app.get(PrismaService);
        await prisma.session.deleteMany();
        await prisma.user.deleteMany();
    });

    afterAll(async () => {
        // Limpieza final y cierre
        await prisma.session.deleteMany();
        await prisma.user.deleteMany();
        await app.close();
    });

    // 1. REGISTRO
    it('/auth/register (POST) - Debería crear un usuario y devolver tokens', async () => {
        const response = await request(app.getHttpServer())
            .post('/api/v1/auth/register') // Asegúrate que el prefijo coincida con main.ts
            .send(testUser)
            .expect(201);

        // Validamos que la respuesta tenga lo esperado
        expect(response.body).toHaveProperty('user');
        expect(response.body).toHaveProperty('accessToken');
        expect(response.body).toHaveProperty('refreshToken');
        expect(response.body.user.email).toBe(testUser.email);
        expect(response.body.user.password).toBeUndefined(); // Seguridad: no devolver password
    });

    // 2. LOGIN
    it('/auth/login (POST) - Debería autenticar y devolver nuevos tokens', async () => {
        const response = await request(app.getHttpServer())
            .post('/api/v1/auth/login')
            .send({ email: testUser.email, password: testUser.password })
            .expect(201);

        expect(response.body).toHaveProperty('accessToken');
        expect(response.body).toHaveProperty('refreshToken');

        // Guardamos los tokens para los siguientes tests
        accessToken = response.body.accessToken;
        refreshToken = response.body.refreshToken;
    });

    // 3. PERFIL (Protected Route)
    it('/auth/profile (GET) - Debería acceder con Token válido', async () => {
        const response = await request(app.getHttpServer())
            .get('/api/v1/auth/profile')
            .set('Authorization', `Bearer ${accessToken}`) // Inyectamos el token
            .expect(200);

        expect(response.body.email).toBe(testUser.email);
        // Verificamos que los roles vengan correctamente (array)
        expect(Array.isArray(response.body.roles)).toBe(true);
        expect(response.body.roles).toContain('USER');
    });

    // 4. RBAC (Seguridad de Roles)
    it('/auth/admin-only (GET) - Debería bloquear acceso a usuarios sin rol ADMIN', async () => {
        // Intentamos entrar con el token del usuario normal (que solo tiene rol USER)
        await request(app.getHttpServer())
            .get('/api/v1/auth/admin-only')
            .set('Authorization', `Bearer ${accessToken}`)
            .expect(403); // ForbiddenException
    });

    // 5. REFRESH TOKEN
    it('/auth/refresh (POST) - Debería rotar tokens', async () => {
        // Esperamos un poco para simular paso de tiempo (opcional, solo para realismo)
        const response = await request(app.getHttpServer())
            .post('/api/v1/auth/refresh')
            .send({ refreshToken: refreshToken })
            .expect(201);

        expect(response.body).toHaveProperty('accessToken');
        expect(response.body).toHaveProperty('refreshToken');

        // IMPORTANTE: El refresh token DEBE haber cambiado (Rotación)
        expect(response.body.refreshToken).not.toBe(refreshToken);

        // Actualizamos nuestras variables con los nuevos tokens
        accessToken = response.body.accessToken;
        refreshToken = response.body.refreshToken;
    });

    // 6. LOGOUT
    it('/auth/logout (POST) - Debería revocar la sesión', async () => {
        await request(app.getHttpServer())
            .post('/api/v1/auth/logout')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ refreshToken: refreshToken }) // Enviamos el refresh token específico a cerrar
            .expect(201);
    });

    // 7. VERIFICACIÓN POST-LOGOUT
    it('Debería fallar al intentar refrescar con el token revocado', async () => {
        await request(app.getHttpServer())
            .post('/api/v1/auth/refresh')
            .send({ refreshToken: refreshToken })
            .expect(401); // UnauthorizedException: "Sesión no encontrada o revocado"
    });
});