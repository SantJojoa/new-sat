import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private prisma: PrismaService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const permissionMetadata = this.reflector.getAllAndOverride<{ module: string; action: string }>(
            PERMISSIONS_KEY,
            [context.getHandler(), context.getClass()],
        );

        if (!permissionMetadata) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user) {
            throw new ForbiddenException('Usuario no autenticado');
        }

        // Obtener el módulo correspondiente
        const module = await this.prisma.modules.findUnique({
            where: { name: permissionMetadata.module },
        });

        if (!module) {
            throw new ForbiddenException('Módulo no encontrado');
        }

        // Buscar el permiso para el tipo de usuario y el módulo
        const permission = await this.prisma.permissions.findUnique({
            where: {
                user_type_id_module_id: {
                    user_type_id: user.user_type_id,
                    module_id: module.id,
                },
            },
        });

        if (!permission) {
            throw new ForbiddenException('No tienes permisos para acceder a este recurso');
        }

        // Verificar el permiso específico basado en la acción
        const actionMap: Record<string, keyof typeof permission> = {
            view: 'can_view',
            create: 'can_create',
            edit: 'can_edit',
            delete: 'can_delete',
            approve: 'can_approve',
        };

        const permissionField = actionMap[permissionMetadata.action];
        if (!permissionField || !permission[permissionField]) {
            throw new ForbiddenException(
                `No tienes permiso para ${permissionMetadata.action} en ${permissionMetadata.module}`,
            );
        }

        return true;
    }
}
