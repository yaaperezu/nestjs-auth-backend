import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '@prisma/client';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredRoles) return true;

        const { user } = context.switchToHttp().getRequest();

        if (!user || !user.roles) { // 👈 Ojo: ahora validamos .roles (plural)
            throw new ForbiddenException('No tienes permisos (Sin roles asignados)');
        }

        // Lógica Enterprise: ¿Tiene el usuario AL MENOS UNO de los roles requeridos?
        // Usamos .some() para iterar el array del usuario
        const hasRole = requiredRoles.some((role) => user.roles.includes(role));

        if (!hasRole) {
            throw new ForbiddenException(`Se requiere uno de los siguientes roles: ${requiredRoles.join(', ')}`);
        }

        return true;
    }
}