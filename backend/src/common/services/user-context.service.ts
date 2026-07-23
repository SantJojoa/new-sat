import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { users } from '@prisma/client';

@Injectable()
export class UserContextService {
    constructor(private prisma: PrismaService) { }

    async getUserType(user: users) {
        return this.prisma.user_types.findUnique({ where: { id: user.user_type_id } });
    }

    async getUserSubdireccionId(user: users): Promise<string | null> {
        if (user.subdireccion_id) return user.subdireccion_id;
        if (!user.area_id) return null;
        const userArea = await this.prisma.areas.findUnique({
            where: { id: user.area_id },
            select: { subdireccion_id: true }
        });
        return userArea?.subdireccion_id || null;
    }

    // Resuelve el área destino de un registro (salida/articulación/asesoría) que se está creando.
    // Prioriza el área explícita del DTO, luego el área del solicitante en cuyo nombre se
    // registra (caso admin_subdireccion, que no tiene área propia), y por último el área
    // del propio usuario autenticado.
    async resolveTargetAreaId(
        explicitAreaId: string | undefined | null,
        solicitanteId: string | undefined | null,
        user: users,
    ): Promise<string | null> {
        if (explicitAreaId) return explicitAreaId;

        if (solicitanteId && solicitanteId !== user.id) {
            const solicitante = await this.prisma.users.findUnique({
                where: { id: solicitanteId },
                select: { area_id: true },
            });
            if (solicitante?.area_id) return solicitante.area_id;
        }

        return user.area_id;
    }
}
