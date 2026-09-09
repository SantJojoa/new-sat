import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AsesoriasFirmaService {
    constructor(private prisma: PrismaService) { }

    async getByToken(token: string) {
        const asistente = await this.prisma.asesoria_asistentes.findUnique({
            where: { firma_token: token },
            include: { asesoria: { select: { codigo: true, institucion: true } } },
        });
        if (!asistente) throw new NotFoundException('Enlace de firma no válido');

        return {
            nombre: asistente.nombre,
            apellido: asistente.apellido,
            institucion: asistente.asesoria.institucion,
            asesoriaCodigo: asistente.asesoria.codigo,
            firmado: !!asistente.firmado_at,
        };
    }

    async saveFirma(token: string, firma: string, ip: string) {
        if (firma.length > 2_000_000) throw new BadRequestException('La firma es demasiado grande');

        const asistente = await this.prisma.asesoria_asistentes.findUnique({ where: { firma_token: token } });
        if (!asistente) throw new NotFoundException('Enlace de firma no válido');

        await this.prisma.asesoria_asistentes.update({
            where: { firma_token: token },
            data: { firma_data: firma, firma_ip: ip, firmado_at: new Date() },
        });
        return { success: true };
    }
}