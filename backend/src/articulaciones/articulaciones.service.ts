import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateArticulacionDto } from './dto/create-articulacion.dto';
import { UpdateArticulacionDto } from './dto/update-articulacion.dto';
import { users } from '@prisma/client';

@Injectable()
export class ArticulacionesService {
    constructor(private prisma: PrismaService) { }

    private parseDateLocal(dateStr: string | Date): Date {
        if (dateStr instanceof Date) return dateStr;
        if (dateStr.includes('T')) return new Date(dateStr);
        return new Date(`${dateStr}T12:00:00`);
    }

    private async getUserType(user: users) {
        return this.prisma.user_types.findUnique({ where: { id: user.user_type_id } });
    }

    async create(dto: CreateArticulacionDto, user: users) {
        const targetAreaId = dto.area_id || user.area_id;
        if (!targetAreaId) throw new BadRequestException('No se ha especificado o no tiene un área asignada');

        const userArea = await this.prisma.areas.findUnique({ where: { id: targetAreaId }, select: { name: true } });
        if (!userArea) throw new BadRequestException('El área especificada no es válida');

        const now = new Date();
        const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
        const prefix = `ART-${dateStr}-${userArea.name.substring(0, 3).toUpperCase()}`;
        const count = await this.prisma.articulaciones.count({ where: { codigo: { startsWith: prefix } } });
        const codigo = `${prefix}${String(count + 1).padStart(2, '0')}`;

        return this.prisma.articulaciones.create({
            data: {
                codigo,
                tipo_programacion: dto.tipo_programacion,
                tema: dto.tema,
                fecha_inicio: this.parseDateLocal(dto.fecha_inicio),
                fecha_final: this.parseDateLocal(dto.fecha_final),
                jornada: dto.jornada,
                instituciones_convocadas: dto.instituciones_convocadas,
                transporte_medio: dto.transporte_medio,
                transporte_num_instituciones: dto.transporte_num_instituciones,
                lugar_evento_id: dto.lugar_evento_id,
                responsable_articulacion: dto.responsable_articulacion,
                estado: 'pendiente',
                solicitante_id: dto.solicitante_id || user.id,
                area_id: targetAreaId,
            },
            include: {
                solicitante: { select: { id: true, names: true, email: true } },
                areas: { select: { id: true, name: true } },
                lugar_evento: true,
            }
        });
    }

    async findAll(user: users, viewAll: boolean = false) {
        const userType = await this.getUserType(user);
        if (!userType) throw new ForbiddenException('Tipo no encontrado');

        let where: any = {};

        if (!viewAll) {
            if (userType.name === 'admin_subdireccion') {
                const subdireccionId = user.subdireccion_id || (user.area_id
                    ? (await this.prisma.areas.findUnique({ where: { id: user.area_id }, select: { subdireccion_id: true } }))?.subdireccion_id
                    : null);
                if (!subdireccionId) throw new ForbiddenException('Área no encontrada');
                where = { areas: { subdireccion_id: subdireccionId } };
            } else if (userType.name !== 'superadmin') {
                where = { solicitante_id: user.id };
            }
        }

        return this.prisma.articulaciones.findMany({
            where,
            include: {
                solicitante: { select: { id: true, names: true, email: true } },
                areas: { select: { id: true, name: true } },
                lugar_evento: true,
            },
            orderBy: { fecha_inicio: 'desc' }
        });
    }

    async findOne(id: string, user: users) {
        const articulacion = await this.prisma.articulaciones.findUnique({
            where: { id },
            include: {
                solicitante: { select: { id: true, names: true, email: true } },
                areas: { select: { id: true, name: true } },
                lugar_evento: true,
            }
        });

        if (!articulacion) throw new NotFoundException(`Articulación ${id} no encontrada`);

        const userType = await this.getUserType(user);

        if (userType?.name === 'admin_subdireccion') {
            const subdireccionId = user.subdireccion_id || (user.area_id
                ? (await this.prisma.areas.findUnique({ where: { id: user.area_id }, select: { subdireccion_id: true } }))?.subdireccion_id
                : null);
            const areaInfo = await this.prisma.areas.findUnique({ where: { id: articulacion.area_id }, select: { subdireccion_id: true } });
            if (subdireccionId !== areaInfo?.subdireccion_id)
                throw new ForbiddenException('No tienes permiso');
        } else if (userType?.name !== 'superadmin' && articulacion.solicitante_id !== user.id) {
            throw new ForbiddenException('No tienes permiso');
        }

        return articulacion;
    }

    async update(id: string, dto: UpdateArticulacionDto, user: users) {
        const articulacion = await this.findOne(id, user);

        const userType = await this.getUserType(user);
        if (articulacion.solicitante_id !== user.id && userType?.name !== 'superadmin')
            throw new ForbiddenException('Solo el creador puede editar');

        const data: any = { ...dto };
        if (dto.fecha_inicio) data.fecha_inicio = this.parseDateLocal(dto.fecha_inicio);
        if (dto.fecha_final) data.fecha_final = this.parseDateLocal(dto.fecha_final);
        delete data.area_id;
        delete data.solicitante_id;

        return this.prisma.articulaciones.update({
            where: { id },
            data,
            include: {
                solicitante: { select: { id: true, names: true, email: true } },
                areas: { select: { id: true, name: true } },
                lugar_evento: true,
            }
        });
    }

    async remove(id: string, user: users) {
        await this.findOne(id, user);
        return this.prisma.articulaciones.delete({ where: { id } });
    }

    async getCatalogos(user: users) {
        const [municipios, areas, lideres] = await Promise.all([
            this.prisma.municipios.findMany({ orderBy: { name: 'asc' } }),
            this.prisma.areas.findMany({ orderBy: { name: 'asc' } }),
            this.prisma.users.findMany({
                where: { is_active: true },
                select: { id: true, names: true, last_name: true },
                orderBy: { names: 'asc' }
            }),
        ]);

        return {
            municipios: municipios.map(m => ({ id: m.id, name: m.name })),
            areas: areas.map(a => ({ id: a.id, name: a.name })),
            lideres: lideres.map(l => ({ id: l.id, name: `${l.names} ${l.last_name}` })),
        };
    }
}
