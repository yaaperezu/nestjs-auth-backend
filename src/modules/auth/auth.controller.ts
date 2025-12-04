import { Controller, Post, Body, Get, Request, Ip, Headers } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { Public } from './decorators/is-public.decorator';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LogoutDto } from './dto/logout.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Registrar nuevo usuario y crear sesión' })
  register(
    @Body() registerUserDto: RegisterUserDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    // Si estás detrás de Nginx/Cloudflare, asegúrate de configurar 'trust proxy' en main.ts
    return this.authService.register(registerUserDto, ip, userAgent);
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión y obtener tokens' })
  login(
    @Body() loginUserDto: LoginUserDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.authService.login(loginUserDto, ip, userAgent);
  }

  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener perfil del usuario autenticado' })
  getProfile(@Request() req: any) {
    return req.user;
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Rotar refresh token y obtener nuevo access token' })
  refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refresh(refreshTokenDto);
  }

  @Post('logout')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cerrar sesión (Revocar tokens)' })
  // Usa el DTO aquí para que Swagger sepa qué mostrar
  logout(@Request() req: any, @Body() logoutDto: LogoutDto) {
    if (!logoutDto.refreshToken) {
      return this.authService.logout(req.user.id);
    }
    return this.authService.logoutSpecificSession(logoutDto.refreshToken);
  }
}