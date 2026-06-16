import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateArticulacionDto } from './dto/create-articulacion.dto';
import { UpdateArticulacionDto } from './dto/update-articulacion.dto';
import { users } from '@prisma/client';
import { ArticulacionesExcelReport } from './reports/articulaciones-excel.report';
import { ArticulacionesPdfReport } from './reports/articulaciones-pdf.report';

@Injectable()
export class ArticulacionesService {
    constructor(
        private prisma: PrismaService,
        private excelReport: ArticulacionesExcelReport,
        private pdfReport: ArticulacionesPdfReport,
    ) { }

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

        const effectiveViewAll = viewAll && userType.name === 'superadmin';

        if (!effectiveViewAll) {
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
                areas: { select: { id: true, name: true, subdirecciones: { select: { id: true, name: true } } } },
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

    async exportExcel(user: users, startDate?: string, endDate?: string, areaId?: string, estado?: string, subdireccionId?: string) {
        const data = await this.getEstadisticas(user, startDate, endDate, areaId, estado, subdireccionId);
        const area = areaId ? await this.prisma.areas.findUnique({ where: { id: areaId }, select: { name: true } }) : null;
        const userInfo = await this.prisma.users.findUnique({ where: { id: user.id }, select: { names: true, last_name: true } });
        return this.excelReport.generate(data, {
            startDate, endDate, areaName: area?.name, authorName: `${userInfo?.names ?? ''} ${userInfo?.last_name ?? ''}`.trim(),
            reportTitle: 'Reporte de Articulaciones Intersectoriales', filenamePrefix: 'Reporte_Articulaciones',
        });
    }

    async exportPdf(user: users, startDate?: string, endDate?: string, areaId?: string, estado?: string, subdireccionId?: string) {
        const data = await this.getEstadisticas(user, startDate, endDate, areaId, estado, subdireccionId);
        const area = areaId ? await this.prisma.areas.findUnique({ where: { id: areaId }, select: { name: true } }) : null;
        const userInfo = await this.prisma.users.findUnique({ where: { id: user.id }, select: { names: true, last_name: true } });
        return this.pdfReport.generate(data, {
            startDate, endDate, areaName: area?.name, authorName: `${userInfo?.names ?? ''} ${userInfo?.last_name ?? ''}`.trim(),
            reportTitle: 'Reporte de Articulaciones Intersectoriales', filenamePrefix: 'Reporte_Articulaciones',
        });
    }

    async getEstadisticas(user: users, startDate?: string, endDate?: string, areaId?: string, estado?: string, subdireccionId?: string) {
        const where: any = {};
        if (areaId) where.area_id = areaId;
        if (estado) where.estado = estado;
        if (subdireccionId) where.areas = { subdireccion_id: subdireccionId };
        if (startDate || endDate) {
            where.fecha_inicio = {};
            if (startDate) where.fecha_inicio.gte = new Date(`${startDate}T00:00:00`);
            if (endDate) where.fecha_inicio.lte = new Date(`${endDate}T23:59:59`);
        }

        const items = await this.prisma.articulaciones.findMany({
            where,
            include: { solicitante: { select: { id: true, names: true, last_name: true } }, areas: { select: { id: true, name: true, subdirecciones: { select: { id: true, name: true } } } } },
            orderBy: { fecha_inicio: 'desc' }
        });

        const total = items.length;

        const estadosMap = items.reduce((acc, item) => { acc[item.estado] = (acc[item.estado] || 0) + 1; return acc; }, {} as Record<string, number>);
        const estados = Object.entries(estadosMap).map(([name, count]) => ({ name, count }));

        const solMap = items.reduce((acc, item) => {
            const name = `${item.solicitante.names} ${(item.solicitante as any).last_name || ''}`.trim();
            acc[name] = (acc[name] || 0) + 1; return acc;
        }, {} as Record<string, number>);
        const topSolicitantes = Object.entries(solMap).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5);

        const areasMap = items.reduce((acc, item) => { const name = item.areas?.name || 'Sin área'; acc[name] = (acc[name] || 0) + 1; return acc; }, {} as Record<string, number>);
        const areas = Object.entries(areasMap).map(([name, count]) => ({ name, count }));

        const subdireccionesMap = items.reduce((acc, item: any) => { const name = item.areas?.subdirecciones?.name || 'Sin subdirección'; acc[name] = (acc[name] || 0) + 1; return acc; }, {} as Record<string, number>);
        const porSubdireccion = Object.entries(subdireccionesMap).map(([name, count]) => ({ name, count }));

        return { total, estados, topSolicitantes, areas, porSubdireccion, items };
    }

    async getCatalogos(user: users) {
        const [municipios, areas, lideres, subdirecciones] = await Promise.all([
            this.prisma.municipios.findMany({ orderBy: { name: 'asc' } }),
            this.prisma.areas.findMany({ orderBy: { name: 'asc' }, include: { subdirecciones: { select: { id: true, name: true } } } }),
            this.prisma.users.findMany({
                where: { is_active: true },
                select: { id: true, names: true, last_name: true },
                orderBy: { names: 'asc' }
            }),
            this.prisma.subdirecciones.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
        ]);

        return {
            municipios: municipios.map(m => ({ id: m.id, name: m.name })),
            areas: areas.map(a => ({ id: a.id, name: a.name, subdireccion_id: a.subdireccion_id || undefined, subdirecciones: a.subdirecciones ? { id: a.subdirecciones.id, name: a.subdirecciones.name } : undefined })),
            lideres: lideres.map(l => ({ id: l.id, name: `${l.names} ${l.last_name}` })),
            subdirecciones: subdirecciones.map(s => ({ id: s.id, name: s.name })),
        };
    }
}
