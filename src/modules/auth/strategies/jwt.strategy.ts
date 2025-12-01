import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { envs } from 'src/config/envs';
import { PrismaService } from 'src/providers/prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private readonly prisma: PrismaService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: envs.JWT_SECRET,
        });
    }

    async validate(payload: any) {
        const { email } = payload;

        const user = await this.prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            throw new UnauthorizedException('Token no válido');
        }

        if (user.status !== 'ACTIVE') {
            throw new UnauthorizedException('Usuario inactivo, contacte al administrador');
        }

        // Lo que retornamos aquí se inyecta automáticamente en `request.user`
        return user;
    }
}