import { Injectable, ConflictException, InternalServerErrorException, Logger, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/providers/prisma/prisma.service';
import { RegisterUserDto } from './dto/register-user.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { LoginUserDto } from './dto/login-user.dto';
import { envs } from 'src/config/envs';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger('AuthService');

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) { }

  async register(registerUserDto: RegisterUserDto) {
    const { password, email, ...userData } = registerUserDto;

    try {
      const userExists = await this.prisma.user.findUnique({ where: { email } });
      if (userExists) throw new ConflictException('El correo electrónico ya está registrado');

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await this.prisma.user.create({
        data: { ...userData, email, password: hashedPassword },
      });

      // Creamos la sesión inmediatamente al registrarse
      const tokens = await this.createSession(user);

      return {
        user: this.excludePassword(user),
        ...tokens,
      };

    } catch (error) {
      this.handleErrors(error);
    }
  }

  async login(loginUserDto: LoginUserDto) {
    const { email, password } = loginUserDto;

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) throw new UnauthorizedException('Credenciales inválidas');

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) throw new UnauthorizedException('Credenciales inválidas');

    // Creamos la sesión en DB
    const tokens = await this.createSession(user);

    return {
      user: this.excludePassword(user),
      ...tokens,
    };
  }

  private async createSession(user: any) {
    const payload = { sub: user.id, email: user.email, role: user.role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, { expiresIn: '15m', secret: envs.JWT_SECRET }), // Access Token (Vida corta)
      this.jwtService.signAsync(payload, { expiresIn: '7d', secret: envs.JWT_REFRESH_SECRET }), // Refresh Token (Vida larga)
    ]);

    // Guardar en la tabla Session
    await this.prisma.session.create({
      data: {
        userId: user.id,
        refreshToken: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
        // Aquí podríamos capturar IP y UserAgent si los pasamos desde el controlador
      },
    });

    return { accessToken, refreshToken };
  }

  private excludePassword(user: any) {
    const { password, ...rest } = user;
    return rest;
  }

  private handleErrors(error: any): never {
    if (error instanceof ConflictException) throw error;
    this.logger.error(error);
    throw new InternalServerErrorException('Error inesperado');
  }

  // ... (imports y constructor)

  async refresh(refreshTokenDto: RefreshTokenDto) {
    const { refreshToken } = refreshTokenDto;

    try {
      // 1. Verificar la firma del token (sin mirar DB aún)
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: envs.JWT_REFRESH_SECRET,
      });

      // 2. Buscar la sesión activa en la DB
      const session = await this.prisma.session.findUnique({
        where: { refreshToken },
        include: { user: true }, // Traemos el usuario para generar los nuevos tokens
      });

      // 3. Validaciones de seguridad
      if (!session) {
        // OJO: Si el token es válido criptográficamente pero no está en la DB, 
        // podría ser un intento de reuso (robo de token).
        throw new UnauthorizedException('Sesión no encontrada o revocado');
      }

      if (session.expiresAt < new Date()) {
        // Borramos la sesión vencida para limpiar
        await this.prisma.session.delete({ where: { id: session.id } });
        throw new UnauthorizedException('Sesión expirada, por favor inicie sesión nuevamente');
      }

      if (session.user.status !== 'ACTIVE') {
        throw new UnauthorizedException('Usuario inactivo');
      }

      // 4. ROTACIÓN: Generar nuevos tokens
      const user = session.user;
      const userPayload = { sub: user.id, email: user.email, role: user.role };

      const [newAccessToken, newRefreshToken] = await Promise.all([
        this.jwtService.signAsync(userPayload, {
          expiresIn: '15m',
          secret: envs.JWT_SECRET
        }),
        this.jwtService.signAsync(userPayload, {
          expiresIn: '7d',
          secret: envs.JWT_REFRESH_SECRET
        }),
      ]);

      // 5. Actualizar la sesión en DB (Reemplazamos el token viejo por el nuevo)
      await this.prisma.session.update({
        where: { id: session.id },
        data: {
          refreshToken: newRefreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Extender vida 7 días más
          lastActiveAt: new Date(),
        },
      });

      return {
        user: this.excludePassword(user),
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };

    } catch (error) {
      // Si jwtService.verifyAsync falla (token malformado o expirado), cae aquí
      this.logger.error(`Error refreshing token: ${error}`);
      throw new UnauthorizedException('Token de refresco inválido');
    }
  }
}