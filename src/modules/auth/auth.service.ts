import { Injectable, ConflictException, InternalServerErrorException, Logger, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/providers/prisma/prisma.service';
import { RegisterUserDto } from './dto/register-user.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { LoginUserDto } from './dto/login-user.dto';

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
      // 1. Verificar si el usuario ya existe
      const userExists = await this.prisma.user.findUnique({
        where: { email },
      });

      if (userExists) {
        throw new ConflictException('El correo electrónico ya está registrado');
      }

      // 2. Encriptar la contraseña
      const hashedPassword = await bcrypt.hash(password, 10);

      // 3. Crear el usuario en base de datos
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const user = await this.prisma.user.create({
        data: {
          ...userData,
          email,
          password: hashedPassword,
        },
      });

      // 4. Retornar usuario (sin la contraseña) y/o token
      // Por ahora solo retornamos el usuario limpio
      return {
        id: user.id,
        email: user.email,
        name: user.name,
      };

    } catch (error) {
      // Manejo de errores centralizado
      if (error instanceof ConflictException) throw error;

      this.logger.error(`Error registrando usuario: ${error}`);
      throw new InternalServerErrorException('Error inesperado al registrar usuario');
    }
  }

  async login(loginUserDto: LoginUserDto) {
    const { email, password } = loginUserDto;

    // 1. Buscar usuario
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas (email)');
    }

    // 2. Verificar contraseña
    // Nota: Si el usuario no tiene password (ej. se registró con Google), esto fallaría.
    // Validamos que user.password exista.
    if (!user.password) {
      throw new UnauthorizedException('Esta cuenta usa inicio de sesión social');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas (password)');
    }

    // 3. Generar el Payload (lo que va dentro del token)
    const payload = { sub: user.id, email: user.email, role: user.role };

    const token = await this.jwtService.signAsync(payload);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token: token,
    };
  }
}