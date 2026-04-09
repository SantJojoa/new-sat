import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIvcDto } from './dto/create-ivc.dto';
import { UpdateIvcDto } from './dto/update-ivc.dto';
import { users } from '@prisma/client';
import { IvcExcelReport } from './reports/ivc-excel.report';
import { IvcPdfReport } from './reports/ivc-pdf.report';

@Injectable()
export class IvcService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly excelReport: IvcExcelReport,
        private readonly pdfReport: IvcPdfReport,
    ) { }

    private async getUserType(user: users) {
        return this.prisma.user_types.findUnique({ where: { id: user.user_type_id } });
    }

    private async generateCodigo(): Promise<string> {
        const count = await this.prisma.ivc.count();
        return `IVC-${String(count + 1).padStart(5, '0')}`;
    }

    async create(dto: CreateIvcDto, user: users) {
        const userType = await this.getUserType(user);
        if (!userType) throw new ForbiddenException('Tipo no encontrado');

        let targetAreaId = user.area_id;

        if (userType.name === 'superadmin' && dto.area_id) {
            targetAreaId = dto.area_id;
        }

        if (!targetAreaId) throw new ForbiddenException('El usuario no tiene área asignada');

        const solicitanteId =
            (userType.name === 'admin_subdireccion' || userType.name === 'superadmin') && dto.solicitante_id
                ? dto.solicitante_id
                : user.id;

        const codigo = await this.generateCodigo();

        return this.prisma.ivc.create({
            data: {
                codigo,
                tipo_programacion: 'IVC',
                tema: dto.tema,
                fecha_inicio: new Date(dto.fecha_inicio),
                fecha_final: new Date(dto.fecha_final),
                jornada: dto.jornada,
                instituciones_convocadas: dto.instituciones_convocadas,
                transporte_medio: dto.transporte_medio,
                transporte_num_instituciones: dto.transporte_num_instituciones,
                lugar_evento_id: dto.lugar_evento_id,
                responsable_articulacion: dto.responsable_articulacion,
                estado: 'pendiente',
                solicitante_id: solicitanteId,
                area_id: targetAreaId,
            },
            include: {
                solicitante: { select: { id: true, names: true, email: true } },
                areas: { select: { id: true, name: true } },
                lugar_evento: true,
            },
        });
    }

    async findAll(user: users, viewAll: boolean = false) {
        const userType = await this.getUserType(user);
        if (!userType) throw new ForbiddenException('Tipo no encontrado');

        let where: any = {};

        if (!viewAll) {
            if (userType.name === 'admin_subdireccion') {
                const subdireccionId =
                    user.subdireccion_id ||
                    (user.area_id
                        ? (await this.prisma.areas.findUnique({ where: { id: user.area_id }, select: { subdireccion_id: true } }))?.subdireccion_id
                        : null);
                if (!subdireccionId) throw new ForbiddenException('Área no encontrada');
                where = { areas: { subdireccion_id: subdireccionId } };
            } else if (userType.name !== 'superadmin') {
                where = { solicitante_id: user.id };
            }
        }

        return this.prisma.ivc.findMany({
            where,
            include: {
                solicitante: { select: { id: true, names: true, email: true } },
                areas: { select: { id: true, name: true } },
                lugar_evento: true,
            },
            orderBy: { created_at: 'desc' },
        });
    }

    async findOne(id: string, user: users) {
        const record = await this.prisma.ivc.findUnique({
            where: { id },
            include: {
                solicitante: { select: { id: true, names: true, email: true } },
                areas: { select: { id: true, name: true } },
                lugar_evento: true,
            },
        });
        if (!record) throw new NotFoundException('IVC no encontrada');
        return record;
    }

    async update(id: string, dto: UpdateIvcDto, user: users) {
        const record = await this.prisma.ivc.findUnique({ where: { id } });
        if (!record) throw new NotFoundException('IVC no encontrada');

        const userType = await this.getUserType(user);
        if (!userType) throw new ForbiddenException('Tipo no encontrado');

        if (userType.name !== 'superadmin' && record.solicitante_id !== user.id) {
            throw new ForbiddenException('No tiene permisos para modificar este registro');
        }

        const data: any = { ...dto };
        if (dto.fecha_inicio) data.fecha_inicio = new Date(dto.fecha_inicio);
        if (dto.fecha_final) data.fecha_final = new Date(dto.fecha_final);
        delete data.area_id;
        delete data.solicitante_id;

        return this.prisma.ivc.update({
            where: { id },
            data,
            include: {
                solicitante: { select: { id: true, names: true, email: true } },
                areas: { select: { id: true, name: true } },
                lugar_evento: true,
            },
        });
    }

    async remove(id: string, user: users) {
        const record = await this.prisma.ivc.findUnique({ where: { id } });
        if (!record) throw new NotFoundException('IVC no encontrada');

        const userType = await this.getUserType(user);
        if (!userType) throw new ForbiddenException('Tipo no encontrado');

        if (userType.name !== 'superadmin' && record.solicitante_id !== user.id) {
            throw new ForbiddenException('No tiene permisos para eliminar este registro');
        }

        return this.prisma.ivc.delete({ where: { id } });
    }

    async exportExcel(user: users, startDate?: string, endDate?: string, areaId?: string, estado?: string) {
        const data = await this.getEstadisticas(user, startDate, endDate, areaId, estado);
        const area = areaId ? await this.prisma.areas.findUnique({ where: { id: areaId }, select: { name: true } }) : null;
        const userInfo = await this.prisma.users.findUnique({ where: { id: user.id }, select: { names: true, last_name: true } });
        return this.excelReport.generate(data, {
            startDate, endDate, areaName: area?.name, authorName: `${userInfo?.names ?? ''} ${userInfo?.last_name ?? ''}`.trim(),
            reportTitle: 'Reporte de IVC — Inspección, Vigilancia y Control', filenamePrefix: 'Reporte_IVC',
        });
    }

    async exportPdf(user: users, startDate?: string, endDate?: string, areaId?: string, estado?: string) {
        const data = await this.getEstadisticas(user, startDate, endDate, areaId, estado);
        const area = areaId ? await this.prisma.areas.findUnique({ where: { id: areaId }, select: { name: true } }) : null;
        const userInfo = await this.prisma.users.findUnique({ where: { id: user.id }, select: { names: true, last_name: true } });
        return this.pdfReport.generate(data, {
            startDate, endDate, areaName: area?.name, authorName: `${userInfo?.names ?? ''} ${userInfo?.last_name ?? ''}`.trim(),
            reportTitle: 'Reporte de IVC — Inspección, Vigilancia y Control', filenamePrefix: 'Reporte_IVC',
        });
    }

    async getEstadisticas(user: users, startDate?: string, endDate?: string, areaId?: string, estado?: string) {
        const userType = await this.getUserType(user);
        const where: any = {};
        if (areaId) where.area_id = areaId;
        if (estado) where.estado = estado;
        if (userType?.name !== 'superadmin' && userType?.name !== 'admin_subdireccion') {
            where.solicitante_id = user.id;
        }
        if (startDate || endDate) {
            where.fecha_inicio = {};
            if (startDate) where.fecha_inicio.gte = new Date(`${startDate}T00:00:00`);
            if (endDate) where.fecha_inicio.lte = new Date(`${endDate}T23:59:59`);
        }

        const items = await this.prisma.ivc.findMany({
            where,
            include: { solicitante: { select: { id: true, names: true, last_name: true } }, areas: { select: { id: true, name: true } } },
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

        return { total, estados, topSolicitantes, areas, items };
    }

    async getCatalogos() {
        const [municipios, areas, lideres] = await Promise.all([
            this.prisma.municipios.findMany({ orderBy: { name: 'asc' } }),
            this.prisma.areas.findMany({ orderBy: { name: 'asc' } }),
            this.prisma.users.findMany({
                where: { is_active: true },
                select: { id: true, names: true, last_name: true },
                orderBy: { names: 'asc' },
            }),
        ]);

        return {
            municipios: municipios.map(m => ({ id: m.id, name: m.name })),
            areas: areas.map(a => ({ id: a.id, name: a.name })),
            lideres: lideres.map(u => ({ id: u.id, name: `${u.names} ${u.last_name}` })),
        };
    }
}
