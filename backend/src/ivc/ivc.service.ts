import { Injectable, ForbiddenException, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIvcDto } from './dto/create-ivc.dto';
import { UpdateIvcDto } from './dto/update-ivc.dto';
import { users } from '@prisma/client';
import { IvcExcelReport } from './reports/ivc-excel.report';
import { IvcPdfReport } from './reports/ivc-pdf.report';
import { UserContextService } from '../common/services/user-context.service';
import { getEstadisticasGenericas } from '../common/utils/estadisticas.util';

@Injectable()
export class IvcService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly excelReport: IvcExcelReport,
        private readonly pdfReport: IvcPdfReport,
        private readonly userContext: UserContextService,
    ) { }

    private async getUserType(user: users) {
        return this.userContext.getUserType(user);
    }

    private async generateCodigo(): Promise<string> {
        const count = await this.prisma.ivc.count();
        const codigo = `IVC-${String(count + 1).padStart(5, '0')}`;
        if (await this.prisma.ivc.findUnique({ where: { codigo } }))
            throw new ConflictException('Error generando código único, intente nuevamente');
        return codigo;
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

        const effectiveViewAll = viewAll && userType.name === 'superadmin';

        if (!effectiveViewAll) {
            if (userType.name === 'admin_subdireccion') {
                const subdireccionId = await this.userContext.getUserSubdireccionId(user);
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
                areas: { select: { id: true, name: true, subdirecciones: { select: { id: true, name: true } } } },
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

        const userType = await this.getUserType(user);

        if (userType?.name === 'admin_subdireccion') {
            const subdireccionId = await this.userContext.getUserSubdireccionId(user);
            const areaInfo = await this.prisma.areas.findUnique({ where: { id: record.area_id }, select: { subdireccion_id: true } });
            if (subdireccionId !== areaInfo?.subdireccion_id)
                throw new ForbiddenException('No tienes permiso');
        } else if (userType?.name !== 'superadmin' && record.solicitante_id !== user.id) {
            throw new ForbiddenException('No tienes permiso');
        }

        return record;
    }

    async update(id: string, dto: UpdateIvcDto, user: users) {
        const record = await this.prisma.ivc.findUnique({ where: { id } });
        if (!record) throw new NotFoundException('IVC no encontrada');
        if (record.estado !== 'pendiente') throw new BadRequestException('Solo pendientes se pueden editar');

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

    async exportExcel(user: users, startDate?: string, endDate?: string, areaId?: string, estado?: string, subdireccionId?: string) {
        const data = await this.getEstadisticas(user, startDate, endDate, areaId, estado, subdireccionId);
        const area = areaId ? await this.prisma.areas.findUnique({ where: { id: areaId }, select: { name: true } }) : null;
        const userInfo = await this.prisma.users.findUnique({ where: { id: user.id }, select: { names: true, last_name: true } });
        return this.excelReport.generate(data, {
            startDate, endDate, areaName: area?.name, authorName: `${userInfo?.names ?? ''} ${userInfo?.last_name ?? ''}`.trim(),
            reportTitle: 'Reporte de IVC — Inspección, Vigilancia y Control', filenamePrefix: 'Reporte_IVC',
        });
    }

    async exportPdf(user: users, startDate?: string, endDate?: string, areaId?: string, estado?: string, subdireccionId?: string) {
        const data = await this.getEstadisticas(user, startDate, endDate, areaId, estado, subdireccionId);
        const area = areaId ? await this.prisma.areas.findUnique({ where: { id: areaId }, select: { name: true } }) : null;
        const userInfo = await this.prisma.users.findUnique({ where: { id: user.id }, select: { names: true, last_name: true } });
        return this.pdfReport.generate(data, {
            startDate, endDate, areaName: area?.name, authorName: `${userInfo?.names ?? ''} ${userInfo?.last_name ?? ''}`.trim(),
            reportTitle: 'Reporte de IVC — Inspección, Vigilancia y Control', filenamePrefix: 'Reporte_IVC',
        });
    }

    async getEstadisticas(user: users, startDate?: string, endDate?: string, areaId?: string, estado?: string, subdireccionId?: string) {
        return getEstadisticasGenericas(this.prisma.ivc, { areaId, estado, subdireccionId, startDate, endDate });
    }

    async getCatalogos() {
        const [municipios, areas, lideres, subdirecciones] = await Promise.all([
            this.prisma.municipios.findMany({ orderBy: { name: 'asc' } }),
            this.prisma.areas.findMany({ orderBy: { name: 'asc' }, include: { subdirecciones: { select: { id: true, name: true } } } }),
            this.prisma.users.findMany({
                where: { is_active: true },
                select: { id: true, names: true, last_name: true, area_id: true },
                orderBy: { names: 'asc' },
            }),
            this.prisma.subdirecciones.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
        ]);

        return {
            municipios: municipios.map(m => ({ id: m.id, name: m.name })),
            areas: areas.map(a => ({ id: a.id, name: a.name, subdireccion_id: a.subdireccion_id || undefined, subdirecciones: a.subdirecciones ? { id: a.subdirecciones.id, name: a.subdirecciones.name } : undefined })),
            lideres: lideres.map(u => ({ id: u.id, name: `${u.names} ${u.last_name}`, area_id: u.area_id || undefined })),
            subdirecciones: subdirecciones.map(s => ({ id: s.id, name: s.name })),
        };
    }
}
