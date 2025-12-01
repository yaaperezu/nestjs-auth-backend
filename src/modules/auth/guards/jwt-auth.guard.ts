import { Injectable, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/is-public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    constructor(private reflector: Reflector) {
        super();
    }

    canActivate(context: ExecutionContext) {
        // 1. Buscamos si la ruta o la clase tiene el decorador @Public
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        // 2. Si es pública, permitimos el acceso sin validar token
        if (isPublic) {
            return true;
        }

        // 3. Si no es pública, ejecutamos la validación estándar de JWT (Passport)
        return super.canActivate(context);
    }
}