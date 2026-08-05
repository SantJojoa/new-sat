import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateArticulacionDto } from './dto/create-articulacion.dto';
import { UpdateArticulacionDto } from './dto/update-articulacion.dto';
import { SetSeguimientoArticulacionDto } from './dto/set-seguimiento-articulacion.dto';
import { users } from '@prisma/client';
import { ArticulacionesExcelReport } from './reports/articulaciones-excel.report';
import { ArticulacionesPdfReport } from './reports/articulaciones-pdf.report';
import { ArticulacionCertificateReport } from './reports/articulacion-certificate.report';
import { parseDateLocal } from '../common/utils/date.util';
import { UserContextService } from '../common/services/user-context.service';
import { getEstadisticasGenericas } from '../common/utils/estadisticas.util';

@Injectable()
export class ArticulacionesService {
    constructor(
        private prisma: PrismaService,
        private excelReport: ArticulacionesExcelReport,
        private pdfReport: ArticulacionesPdfReport,
        private articulacionCertificate: ArticulacionCertificateReport,
        private userContext: UserContextService,
    ) { }

    // Excluye "archivo_manual" (Bytes) de las consultas de listado/detalle para no
    // transferir el PDF completo en cada carga; solo se expone el nombre del archivo.
    private readonly seguimientoArticulacionSelect = {
        id: true,
        articulacion_id: true,
        se_programo: true,
        se_realizo: true,
        nombre_reunion: true,
        fecha_reunion: true,
        hora_inicial: true,
        hora_final: true,
        acta_numero: true,
        institucion: true,
        municipio: true,
        lugar: true,
        material_entregado: true,
        asistentes: true,
        orden_del_dia: true,
        desarrollo: true,
        conclusiones: true,
        compromisos: true,
        proxima_lugar: true,
        proxima_fecha: true,
        proxima_hora: true,
        archivo_manual_nombre: true,
        created_at: true,
        updated_at: true,
    };

    private async getUserType(user: users) {
        return this.userContext.getUserType(user);
    }

    async create(dto: CreateArticulacionDto, user: users) {
        const targetAreaId = await this.userContext.resolveTargetAreaId(dto.area_id, dto.solicitante_id, user);
        if (!targetAreaId) throw new BadRequestException('No se ha especificado o no tiene un área asignada');

        const userArea = await this.prisma.areas.findUnique({ where: { id: targetAreaId }, select: { name: true } });
        if (!userArea) throw new BadRequestException('El área especificada no es válida');

        const now = new Date();
        const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
        const prefix = `ART-${dateStr}-${userArea.name.substring(0, 3).toUpperCase()}`;
        const count = await this.prisma.articulaciones.count({ where: { codigo: { startsWith: prefix } } });
        const codigo = `${prefix}${String(count + 1).padStart(2, '0')}`;

        if (await this.prisma.articulaciones.findUnique({ where: { codigo } }))
            throw new ConflictException('Error generando código único, intente nuevamente');

        return this.prisma.articulaciones.create({
            data: {
                codigo,
                tipo_programacion: dto.tipo_programacion,
                tema: dto.tema,
                fecha_inicio: parseDateLocal(dto.fecha_inicio),
                fecha_final: parseDateLocal(dto.fecha_final),
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
                const subdireccionId = await this.userContext.getUserSubdireccionId(user);
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
                seguimiento_articulacion: { select: this.seguimientoArticulacionSelect },
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
                seguimiento_articulacion: { select: this.seguimientoArticulacionSelect },
            }
        });

        if (!articulacion) throw new NotFoundException(`Articulación ${id} no encontrada`);

        const userType = await this.getUserType(user);

        if (userType?.name === 'admin_subdireccion') {
            const subdireccionId = await this.userContext.getUserSubdireccionId(user);
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
        if (articulacion.estado !== 'pendiente') throw new BadRequestException('Solo pendientes se pueden editar');

        const userType = await this.getUserType(user);
        if (articulacion.solicitante_id !== user.id && userType?.name !== 'superadmin')
            throw new ForbiddenException('Solo el creador puede editar');

        const data: any = { ...dto };
        if (dto.fecha_inicio) data.fecha_inicio = parseDateLocal(dto.fecha_inicio);
        if (dto.fecha_final) data.fecha_final = parseDateLocal(dto.fecha_final);
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
        return getEstadisticasGenericas(this.prisma.articulaciones, { areaId, estado, subdireccionId, startDate, endDate });
    }

    async getCatalogos(user: users) {
        const [municipios, areas, lideres, subdirecciones] = await Promise.all([
            this.prisma.municipios.findMany({ orderBy: { name: 'asc' } }),
            this.prisma.areas.findMany({ orderBy: { name: 'asc' }, include: { subdirecciones: { select: { id: true, name: true } } } }),
            this.prisma.users.findMany({
                where: { is_active: true },
                select: { id: true, names: true, last_name: true, area_id: true },
                orderBy: { names: 'asc' }
            }),
            this.prisma.subdirecciones.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
        ]);

        return {
            municipios: municipios.map(m => ({ id: m.id, name: m.name })),
            areas: areas.map(a => ({ id: a.id, name: a.name, subdireccion_id: a.subdireccion_id || undefined, subdirecciones: a.subdirecciones ? { id: a.subdirecciones.id, name: a.subdirecciones.name } : undefined })),
            lideres: lideres.map(l => ({ id: l.id, name: `${l.names} ${l.last_name}`, area_id: l.area_id || undefined })),
            subdirecciones: subdirecciones.map(s => ({ id: s.id, name: s.name })),
        };
    }

    async setSeguimientoArticulacion(id: string, dto: SetSeguimientoArticulacionDto, user: users) {
        await this.findOne(id, user);

        const existente = await this.prisma.seguimiento_articulacion.findUnique({ where: { articulacion_id: id }, select: { archivo_manual_nombre: true } });
        if (existente?.archivo_manual_nombre) {
            throw new BadRequestException('No se puede diligenciar el formulario porque ya se subió un acta escaneada para esta articulación');
        }

        const fechaReunion = dto.fecha_reunion ? new Date(dto.fecha_reunion) : null;
        const proximaFecha = dto.proxima_fecha ? new Date(dto.proxima_fecha) : null;

        const data = {
            se_programo: dto.se_programo,
            se_realizo: dto.se_realizo,
            nombre_reunion: dto.nombre_reunion ?? null,
            fecha_reunion: fechaReunion,
            hora_inicial: dto.hora_inicial ?? null,
            hora_final: dto.hora_final ?? null,
            acta_numero: dto.acta_numero ?? null,
            institucion: dto.institucion ?? null,
            municipio: dto.municipio ?? null,
            lugar: dto.lugar ?? null,
            material_entregado: dto.material_entregado ?? null,
            asistentes: dto.asistentes as any,
            orden_del_dia: dto.orden_del_dia as any,
            desarrollo: dto.desarrollo ?? null,
            conclusiones: dto.conclusiones ?? null,
            compromisos: dto.compromisos as any,
            proxima_lugar: dto.proxima_lugar ?? null,
            proxima_fecha: proximaFecha,
            proxima_hora: dto.proxima_hora ?? null,
        };

        return this.prisma.seguimiento_articulacion.upsert({
            where: { articulacion_id: id },
            create: { articulacion_id: id, ...data },
            update: data,
            select: this.seguimientoArticulacionSelect,
        });
    }

    async generateCertificadoArticulacion(id: string, user: users): Promise<Buffer> {
        const articulacion = await this.findOne(id, user);
        return this.articulacionCertificate.generate(articulacion);
    }

    async uploadActaArticulacion(id: string, file: Express.Multer.File, user: users) {
        if (!file) throw new BadRequestException('No se recibió ningún archivo');
        await this.findOne(id, user);

        const existente = await this.prisma.seguimiento_articulacion.findUnique({ where: { articulacion_id: id }, select: { se_realizo: true, archivo_manual_nombre: true } });
        if (existente?.se_realizo && !existente.archivo_manual_nombre) {
            throw new BadRequestException('No se puede subir un acta escaneada porque ya se generó el acta por formulario');
        }

        const archivo = new Uint8Array(file.buffer);

        return this.prisma.seguimiento_articulacion.upsert({
            where: { articulacion_id: id },
            create: {
                articulacion_id: id,
                se_programo: true,
                se_realizo: true,
                archivo_manual: archivo,
                archivo_manual_nombre: file.originalname,
            },
            update: {
                archivo_manual: archivo,
                archivo_manual_nombre: file.originalname,
            },
            select: this.seguimientoArticulacionSelect,
        });
    }

    async getActaArchivoArticulacion(id: string, user: users): Promise<{ buffer: Buffer; nombre: string }> {
        await this.findOne(id, user);
        const seguimiento = await this.prisma.seguimiento_articulacion.findUnique({
            where: { articulacion_id: id },
            select: { archivo_manual: true, archivo_manual_nombre: true },
        });
        if (!seguimiento?.archivo_manual) throw new NotFoundException('No hay un acta escaneada cargada para esta articulación');
        return { buffer: Buffer.from(seguimiento.archivo_manual), nombre: seguimiento.archivo_manual_nombre || `acta-${id}.pdf` };
    }
}
