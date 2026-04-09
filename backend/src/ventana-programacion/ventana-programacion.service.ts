import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SetVentanaDto } from './dto/set-ventana.dto';

@Injectable()
export class VentanaProgramacionService {
    constructor(private prisma: PrismaService) { }

    async get() {
        const ventana = await this.prisma.ventana_programacion.findFirst({
            where: { activo: true },
            orderBy: { created_at: 'desc' },
        });

        const now = new Date();
        const abierta = ventana
            ? now >= new Date(ventana.fecha_inicio) && now <= new Date(ventana.fecha_fin)
            : false;

        return { ventana, abierta };
    }

    async set(dto: SetVentanaDto, user: any) {
        if (user?.user_types?.name !== 'superadmin') {
            throw new ForbiddenException('Solo el superadmin puede configurar la ventana de programación');
        }

        await this.prisma.ventana_programacion.updateMany({
            where: { activo: true },
            data: { activo: false },
        });

        const fecha_inicio = new Date(`${dto.fecha_inicio}T00:00:00`);
        const fecha_fin = new Date(`${dto.fecha_fin}T23:59:59`);

        return this.prisma.ventana_programacion.create({
            data: { fecha_inicio, fecha_fin, activo: true },
        });
    }

    async deactivate(user: any) {
        if (user?.user_types?.name !== 'superadmin') {
            throw new ForbiddenException('Solo el superadmin puede desactivar la ventana');
        }

        await this.prisma.ventana_programacion.updateMany({
            where: { activo: true },
            data: { activo: false },
        });

        return { message: 'Ventana desactivada' };
    }
}
