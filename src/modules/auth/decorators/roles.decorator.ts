import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client'; // Importamos el enum nativo de Prisma

export const ROLES_KEY = 'roles';
// Permite pasar uno o varios roles: @Roles(Role.ADMIN, Role.SUPPORT)
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);