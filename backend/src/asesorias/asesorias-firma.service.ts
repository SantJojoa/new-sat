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
        if (asistente) {
            return {
                nombre: asistente.nombre,
                apellido: asistente.apellido,
                institucion: asistente.asesoria.institucion,
                asesoriaCodigo: asistente.asesoria.codigo,
                firmado: !!asistente.firmado_at,
            };
        }

        const asesoria = await this.prisma.asesorias.findUnique({
            where: { firma_registrador_token: token },
            include: { registrador: { select: { names: true, last_name: true } } },
        });
        if (asesoria) {
            return {
                nombre: asesoria.registrador.names,
                apellido: asesoria.registrador.last_name,
                institucion: asesoria.institucion,
                asesoriaCodigo: asesoria.codigo,
                firmado: !!asesoria.firmado_registrador_at,
            };
        }

        throw new NotFoundException('Enlace de firma no válido');
    }

    async saveFirma(token: string, firma: string, ip: string) {
        if (firma.length > 2_000_000) throw new BadRequestException('La firma es demasiado grande');

        const asistente = await this.prisma.asesoria_asistentes.findUnique({ where: { firma_token: token } });
        if (asistente) {
            await this.prisma.asesoria_asistentes.update({
                where: { firma_token: token },
                data: { firma_data: firma, firma_ip: ip, firmado_at: new Date() },
            });
            return { success: true };
        }

        const asesoria = await this.prisma.asesorias.findUnique({ where: { firma_registrador_token: token } });
        if (asesoria) {
            await this.prisma.asesorias.update({
                where: { firma_registrador_token: token },
                data: { firma_registrador_data: firma, firma_registrador_ip: ip, firmado_registrador_at: new Date() },
            });
            return { success: true };
        }

        throw new NotFoundException('Enlace de firma no válido');
    }
}