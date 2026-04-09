import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SetVentanaDto } from './dto/set-ventana.dto';
import { VentanaGateway } from './ventana-programacion.gateway';

@Injectable()
export class VentanaProgramacionService {
    constructor(
        private prisma: PrismaService,
        private ventanaGateway: VentanaGateway,
    ) { }

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

        const fecha_inicio = new Date(dto.fecha_inicio);
        const fecha_fin = new Date(dto.fecha_fin);

        const created = await this.prisma.ventana_programacion.create({
            data: { fecha_inicio, fecha_fin, activo: true },
        });
        const now = new Date();
        const abierta = now >= fecha_inicio && now <= fecha_fin;
        this.ventanaGateway.emitVentanaActualizada(abierta);
        return created;
    }

    async deactivate(user: any) {
        if (user?.user_types?.name !== 'superadmin') {
            throw new ForbiddenException('Solo el superadmin puede desactivar la ventana');
        }

        await this.prisma.ventana_programacion.updateMany({
            where: { activo: true },
            data: { activo: false },
        });
        this.ventanaGateway.emitVentanaActualizada(false);
        return { message: 'Ventana desactivada' };
    }
}
