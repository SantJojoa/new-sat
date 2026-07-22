import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSalidaDto } from './dto/create-salida.dto';
import { UpdateSalidaDto } from './dto/update-salida.dto';
import { ApproveSalidaDto, RejectSalidaDto, BulkApproveSalidaDto, BulkRejectSalidaDto } from './dto/aprove-salida.dto';
import { users } from '@prisma/client';
import { SalidasPdfReport } from './reports/salidas-pdf.report';
import { SalidasExcelReport } from './reports/salidas-excel.report';
import { NotificationsService } from '../notifications/notifications.service';
import { SetSeguimientoDto } from './dto/set-seguimiento.dto';
import { SetSeguimientoIvcDto } from './dto/set-seguimiento-ivc.dto';
import { SetSeguimientoArticulacionIvDto } from './dto/set-seguimiento-articulacion-iv.dto';
import { SetSeguimientoAcompanamientoDto } from './dto/set-seguimiento-acompanamiento.dto';
import { AcompanamientoCertificateReport } from './reports/acompanamiento-certificate.report';
import { parseDateLocal } from '../common/utils/date.util';
import { UserContextService } from '../common/services/user-context.service';

@Injectable()
export class SalidasService {
    constructor(
        private prisma: PrismaService,
        private pdfReport: SalidasPdfReport,
        private excelReport: SalidasExcelReport,
        private notifications: NotificationsService,
        private acompanamientoCertificate: AcompanamientoCertificateReport,
        private userContext: UserContextService,
    ) { }

    // Excluye "archivo_manual" (Bytes) de las consultas de listado/detalle para no
    // transferir el PDF completo en cada carga; solo se expone el nombre del archivo.
    private readonly seguimientoAcompanamientoSelect = {
        id: true,
        salida_id: true,
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

    private async checkConflicts(
        start: Date, end: Date, jornada: string,
        municipios: string[] = [],
        ips_actores: { ips_id: string; actor_id?: string | null }[] = [],
        entidades: string[] = [],
        eapb_actores: { eapb_id: string; actor_id?: string | null }[] = [],
        organizaciones: string[] = [], idsn: string[] = [],
        excludeId?: string
    ) {
        const jornadaFilter = jornada === 'Completa'
            ? {}
            : { OR: [{ jornada: 'Completa' }, { jornada: jornada }] };

        const resourceOr: any[] = [
            ...(municipios.length > 0 ? [{ municipios: { some: { id: { in: municipios } } } }] : []),
            ...ips_actores.map(item => ({
                salida_ips: { some: { ips_id: item.ips_id, actor_id: item.actor_id ?? null } }
            })),
            ...(entidades.length > 0 ? [{ entidades: { some: { id: { in: entidades } } } }] : []),
            ...eapb_actores.map(item => ({
                salida_eapb: { some: { eapb_id: item.eapb_id, actor_id: item.actor_id ?? null } }
            })),
            ...(organizaciones.length > 0 ? [{ organizaciones: { some: { id: { in: organizaciones } } } }] : []),
            ...(idsn.length > 0 ? [{ idsn: { some: { id: { in: idsn } } } }] : []),
        ];

        if (resourceOr.length === 0) return;

        const whereClause: any = {
            AND: [
                { fecha_inicio: { lte: end }, fecha_final: { gte: start } },
                { estado: { in: ['aprobada', 'pendiente'] } },
                jornadaFilter,
                { OR: resourceOr }
            ]
        };

        if (excludeId) whereClause.AND.push({ id: { not: excludeId } });

        const conflicts = await this.prisma.salidas.findMany({
            where: whereClause,
            include: {
                solicitante: true, areas: true, municipios: true,
                salida_ips: { include: { ips: true, actor: true } }, entidades: true,
                salida_eapb: { include: { eapb: true, actor: true } },
                organizaciones: true, idsn: true
            }
        });

        if (conflicts.length > 0) {
            throw new ConflictException({
                message: `Se encontraron ${conflicts.length} actividad(es) en conflicto`,
                conflicts: conflicts.map(c => ({
                    id: c.id, codigo: c.codigo, tipo_salida: c.tipo_salida, tema: c.tema,
                    fecha_inicio: c.fecha_inicio, fecha_final: c.fecha_final, jornada: c.jornada,
                    area: c.areas.name,
                    solicitante: `${c.solicitante.names} ${c.solicitante.last_name}`,
                    municipios: c.municipios.map(m => m.name), ips: c.salida_ips.map((m: any) => m.ips.type + (m.actor ? ' - ' + m.actor.name : '')),
                    entidades: c.entidades.map(m => m.name),
                    eapb: c.salida_eapb.map(m => m.eapb.name),
                    organizaciones: c.organizaciones.map(m => m.name), idsn: c.idsn.map(m => m.name),
                }))
            });
        }
    }

    async create(createSalidaDto: CreateSalidaDto, user: users) {
        const userType = await this.prisma.user_types.findUnique({ where: { id: user.user_type_id } });
        const isSuperadmin = userType?.name === 'superadmin';

        if (!isSuperadmin) {
            const today = new Date();
            const nextMonthDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
            const nextMonthYear = nextMonthDate.getFullYear();
            const nextMonthIdx = nextMonthDate.getMonth();
            const firstDay = `${nextMonthYear}-${String(nextMonthIdx + 1).padStart(2, '0')}-01`;
            const lastDayNum = new Date(nextMonthYear, nextMonthIdx + 1, 0).getDate();
            const lastDay = `${nextMonthYear}-${String(nextMonthIdx + 1).padStart(2, '0')}-${String(lastDayNum).padStart(2, '0')}`;
            const MONTHS_ES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
            const nextMonthName = `${MONTHS_ES[nextMonthIdx]} de ${nextMonthYear}`;
            if (createSalidaDto.fecha_inicio < firstDay || createSalidaDto.fecha_inicio > lastDay)
                throw new BadRequestException(`Las programaciones solo pueden solicitarse para ${nextMonthName}`);
        }

        const targetAreaId = createSalidaDto.area_id || user.area_id;
        if (!targetAreaId) throw new BadRequestException('No se ha especificado o no tiene un área asignada');

        const userArea = await this.prisma.areas.findUnique({ where: { id: targetAreaId }, select: { name: true } });
        if (!userArea) throw new BadRequestException('El área especificada no es válida');

        const now = new Date();
        const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
        const pattern = `${dateStr}-${userArea.name.substring(0, 3).toUpperCase()}`;
        const count = await this.prisma.salidas.count({ where: { codigo: { startsWith: pattern } } });
        const newCodigo = `${pattern}${String(count + 1).padStart(2, '0')}`;

        if (await this.prisma.salidas.findUnique({ where: { codigo: newCodigo } }))
            throw new ConflictException('Error generando código único, intente nuevamente');

        if (!isSuperadmin) {
            await this.checkConflicts(
                parseDateLocal(createSalidaDto.fecha_inicio), parseDateLocal(createSalidaDto.fecha_final),
                createSalidaDto.jornada, createSalidaDto.municipios_ids,
                createSalidaDto.ips_actores || [],
                createSalidaDto.entidades_ids,
                createSalidaDto.eapb_actores || [],
                createSalidaDto.organizaciones_ids, createSalidaDto.idsn_ids
            );
        }

        let municipiosConvocadosStr: string | undefined;
        if (createSalidaDto.municipios_ids?.length) {
            const munis = await this.prisma.municipios.findMany({ where: { id: { in: createSalidaDto.municipios_ids } }, select: { name: true } });
            municipiosConvocadosStr = munis.map(m => m.name).join(', ');
        }

        const area = await this.prisma.areas.findUnique({ where: { id: targetAreaId }, select: { subdireccion_id: true } });
        const salida = await this.prisma.salidas.create({
            data: {
                codigo: newCodigo, tipo_salida: createSalidaDto.tipo_salida, subtipo_salida: createSalidaDto.subtipo_salida,
                tema: createSalidaDto.tema, descripcion: createSalidaDto.descripcion,
                fecha_inicio: parseDateLocal(createSalidaDto.fecha_inicio),
                fecha_final: parseDateLocal(createSalidaDto.fecha_final),
                jornada: createSalidaDto.jornada, estado: 'pendiente',
                solicitante_id: createSalidaDto.solicitante_id || user.id, area_id: targetAreaId,
                transporte_medio: createSalidaDto.transporte_medio, transporte_responsables: createSalidaDto.transporte_responsables,
                instituciones_convocadas: createSalidaDto.instituciones_convocadas,
                municipios_convocados: municipiosConvocadosStr, lugar_evento_id: createSalidaDto.lugar_evento_id,
                municipios: { connect: createSalidaDto.municipios_ids?.map(id => ({ id })) || [] },
                salida_ips: { create: createSalidaDto.ips_actores?.map(item => ({ ips_id: item.ips_id, actor_id: item.actor_id || null })) || [] },
                entidades: { connect: createSalidaDto.entidades_ids?.map(id => ({ id })) || [] },
                salida_eapb: { create: createSalidaDto.eapb_actores?.map(item => ({ eapb_id: item.eapb_id, actor_id: item.actor_id || null })) || [] },
                organizaciones: { connect: createSalidaDto.organizaciones_ids?.map(id => ({ id })) || [] },
                idsn: { connect: createSalidaDto.idsn_ids?.map(id => ({ id })) || [] }
            },
            include: {
                municipios: true, salida_ips: { include: { ips: true, actor: true } }, entidades: true,
                salida_eapb: { include: { eapb: true, actor: true } },
                organizaciones: true, idsn: true,
                solicitante: { select: { id: true, names: true, email: true } },
                areas: { select: { id: true, name: true } }
            }
        });

        if (area?.subdireccion_id) {
            const adminIds = await this.notifications.findAdminsBySubdireccion(area.subdireccion_id);
            const solicitanteId = createSalidaDto.solicitante_id || user.id;
            const targets = adminIds.filter(id => id !== solicitanteId);
            if (targets.length > 0) {
                await this.notifications.createForMany(targets, 'salida_pendiente',
                    'Nueva Solicitud de Programación',
                    `${salida.solicitante.names} solicitó la programación ${newCodigo}: "${createSalidaDto.tema.substring(0, 60)}"`,
                    '/gestionar-salida');
            }
        }
        return salida;
    }

    async findAll(user: users, viewAll: boolean = false) {
        const include = {
            municipios: true, salida_ips: { include: { ips: true, actor: true } }, entidades: true,
            salida_eapb: { include: { eapb: true, actor: true } },
            organizaciones: true, idsn: true,
            solicitante: { select: { id: true, names: true, email: true } },
            aprobador: { select: { id: true, names: true, email: true } },
            areas: { select: { id: true, name: true, subdireccion_id: true, subdirecciones: { select: { id: true, name: true } } } },
            areas_participantes: { select: { id: true, name: true, subdireccion_id: true, subdirecciones: { select: { id: true, name: true } } } },
            lugar_evento: true,
            seguimiento_capacitacion: true,
            seguimiento_ivc: true,
            seguimiento_articulacion_iv: true,
            seguimiento_acompanamiento: { select: this.seguimientoAcompanamientoSelect },
        };

        const userType = await this.prisma.user_types.findUnique({ where: { id: user.user_type_id } });
        if (!userType) throw new ForbiddenException('Tipo no encontrado');

        let where: any = {};
        const effectiveViewAll = viewAll;
        if (!effectiveViewAll) {
            if (userType.name === 'admin_subdireccion') {
                const subdireccionId = await this.userContext.getUserSubdireccionId(user);
                if (!subdireccionId) throw new ForbiddenException('Área no encontrada');
                where = {
                    OR: [
                        { areas: { subdireccion_id: subdireccionId } },
                        { areas_participantes: { some: { subdireccion_id: subdireccionId } } }
                    ]
                };
            } else if (userType.name !== 'superadmin') {
                where = { solicitante_id: user.id };
            }
        }

        return this.prisma.salidas.findMany({ where, include, orderBy: { fecha_inicio: 'desc' } });
    }

    async findOne(id: string, user: users) {
        const salida = await this.prisma.salidas.findUnique({
            where: { id },
            include: {
                municipios: true, salida_ips: { include: { ips: true, actor: true } }, entidades: true,
                salida_eapb: { include: { eapb: true, actor: true } },
                organizaciones: true, idsn: true,
                lugar_evento: { select: { id: true, name: true } },
                solicitante: { select: { id: true, names: true, email: true } },
                aprobador: { select: { id: true, names: true, email: true } },
                areas: { select: { id: true, name: true, subdireccion_id: true, subdirecciones: { select: { id: true, name: true } } } },
                areas_participantes: { select: { id: true, name: true, subdireccion_id: true, subdirecciones: { select: { id: true, name: true } } } },
                seguimiento_capacitacion: true,
                seguimiento_ivc: true,
                seguimiento_articulacion_iv: true,
                seguimiento_acompanamiento: { select: this.seguimientoAcompanamientoSelect },
            }
        });

        if (!salida) throw new NotFoundException(`Salida ${id} no encontrada`);

        const userType = await this.prisma.user_types.findUnique({ where: { id: user.user_type_id } });

        if (userType?.name === 'admin_subdireccion') {
            const subdireccionId = await this.userContext.getUserSubdireccionId(user);
            const isOwnerSubdir = subdireccionId && salida.areas.subdireccion_id === subdireccionId;
            const isParticipantSubdir = subdireccionId && (salida as any).areas_participantes?.some((ap: any) => ap.subdireccion_id === subdireccionId);
            if (!isOwnerSubdir && !isParticipantSubdir)
                throw new ForbiddenException('No tienes permiso');
        } else if (userType?.name !== 'superadmin' && salida.solicitante_id !== user.id) {
            throw new ForbiddenException('No tienes permiso');
        }

        return salida;
    }

    async update(id: string, updateSalidaDto: UpdateSalidaDto, user: users) {
        const salida = await this.findOne(id, user);
        if (salida.estado !== 'pendiente') throw new BadRequestException('Solo pendientes se pueden editar');

        const userType = await this.prisma.user_types.findUnique({ where: { id: user.user_type_id } });
        if (salida.solicitante_id !== user.id && userType?.name !== 'superadmin')
            throw new ForbiddenException('Solo el creador puede editar');

        if (updateSalidaDto.fecha_inicio || updateSalidaDto.municipios_ids) {
            await this.checkConflicts(
                updateSalidaDto.fecha_inicio ? parseDateLocal(updateSalidaDto.fecha_inicio) : salida.fecha_inicio,
                updateSalidaDto.fecha_final ? parseDateLocal(updateSalidaDto.fecha_final) : salida.fecha_final,
                updateSalidaDto.jornada || salida.jornada,
                updateSalidaDto.municipios_ids || salida.municipios.map(m => m.id),
                updateSalidaDto.ips_actores || (salida as any).salida_ips.map((m: any) => ({ ips_id: m.ips_id, actor_id: m.actor_id })),
                updateSalidaDto.entidades_ids || salida.entidades.map(m => m.id),
                updateSalidaDto.eapb_actores || salida.salida_eapb.map(m => ({ eapb_id: m.eapb_id, actor_id: (m as any).actor_id })),
                updateSalidaDto.organizaciones_ids || salida.organizaciones.map(m => m.id),
                updateSalidaDto.idsn_ids || salida.idsn.map(m => m.id),
                id
            );
        }

        let municipiosConvocadosStr: string | undefined;
        if (updateSalidaDto.municipios_ids?.length) {
            const munis = await this.prisma.municipios.findMany({ where: { id: { in: updateSalidaDto.municipios_ids } }, select: { name: true } });
            municipiosConvocadosStr = munis.map(m => m.name).join(', ');
        }

        return this.prisma.salidas.update({
            where: { id },
            data: {
                tipo_salida: updateSalidaDto.tipo_salida, subtipo_salida: updateSalidaDto.subtipo_salida,
                tema: updateSalidaDto.tema, descripcion: updateSalidaDto.descripcion,
                fecha_inicio: updateSalidaDto.fecha_inicio ? parseDateLocal(updateSalidaDto.fecha_inicio) : undefined,
                fecha_final: updateSalidaDto.fecha_final ? parseDateLocal(updateSalidaDto.fecha_final) : undefined,
                jornada: updateSalidaDto.jornada, transporte_medio: updateSalidaDto.transporte_medio,
                transporte_responsables: updateSalidaDto.transporte_responsables,
                instituciones_convocadas: updateSalidaDto.instituciones_convocadas,
                municipios_convocados: municipiosConvocadosStr, lugar_evento_id: updateSalidaDto.lugar_evento_id,
                municipios: updateSalidaDto.municipios_ids ? { set: updateSalidaDto.municipios_ids.map(id => ({ id })) } : undefined,
                salida_ips: updateSalidaDto.ips_actores !== undefined ? {
                    deleteMany: {},
                    create: updateSalidaDto.ips_actores.map(item => ({ ips_id: item.ips_id, actor_id: item.actor_id || null }))
                } : undefined,
                entidades: updateSalidaDto.entidades_ids ? { set: updateSalidaDto.entidades_ids.map(id => ({ id })) } : undefined,
                salida_eapb: updateSalidaDto.eapb_actores !== undefined ? {
                    deleteMany: {},
                    create: updateSalidaDto.eapb_actores.map(item => ({ eapb_id: item.eapb_id, actor_id: item.actor_id || null }))
                } : undefined,
                organizaciones: updateSalidaDto.organizaciones_ids ? { set: updateSalidaDto.organizaciones_ids.map(id => ({ id })) } : undefined,
                idsn: updateSalidaDto.idsn_ids ? { set: updateSalidaDto.idsn_ids.map(id => ({ id })) } : undefined,
            },
            include: { municipios: true, salida_ips: { include: { ips: true, actor: true } }, entidades: true, salida_eapb: { include: { eapb: true, actor: true } }, organizaciones: true, idsn: true }
        });
    }

    async remove(id: string, user: users) {
        const salida = await this.findOne(id, user);
        const userType = await this.prisma.user_types.findUnique({ where: { id: user.user_type_id } });
        if (salida.estado !== 'pendiente' && userType?.name !== 'superadmin')
            throw new BadRequestException('Solo pendientes se pueden eliminar');
        await this.prisma.solicitudes_union.deleteMany({ where: { salida_id: id } });
        return this.prisma.salidas.delete({ where: { id } });
    }

    async approve(id: string, user: users, approveDto: ApproveSalidaDto) {
        const salida = await this.findOne(id, user);
        if (salida.estado !== 'pendiente') throw new BadRequestException('La salida no está pendiente');
        const userType = await this.prisma.user_types.findUnique({ where: { id: user.user_type_id } });
        if (!['admin_subdireccion', 'superadmin'].includes(userType?.name || '')) throw new ForbiddenException('No autorizado');
        const result = await this.prisma.salidas.update({
            where: { id },
            data: { estado: 'aprobada', fecha_aprobacion: new Date(), aprobador_id: user.id, observaciones: approveDto.observaciones }
        });
        await this.notifications.createForUser(salida.solicitante_id, 'salida_aprobada',
            '✅ Programación Aprobada',
            `Tu programación ${salida.codigo} fue aprobada.${approveDto.observaciones ? ' Observación: ' + approveDto.observaciones : ''}`,
            '/gestionar-salida');
        return result;
    }

    async reject(id: string, user: users, rejectDto: RejectSalidaDto) {
        const salida = await this.findOne(id, user);
        const userType = await this.prisma.user_types.findUnique({ where: { id: user.user_type_id } });
        const canReject = salida.estado === 'pendiente' || (salida.estado === 'aprobada' && userType?.name === 'superadmin');
        if (!canReject) throw new BadRequestException('No se puede rechazar en el estado actual');
        if (!['admin_subdireccion', 'superadmin'].includes(userType?.name || '')) throw new ForbiddenException('No autorizado');
        const result = await this.prisma.salidas.update({
            where: { id },
            data: { estado: 'rechazada', fecha_aprobacion: new Date(), aprobador_id: user.id, observaciones: rejectDto.motivo }
        });
        await this.notifications.createForUser(salida.solicitante_id, 'salida_rechazada',
            '❌ Programación Rechazada',
            `Tu programación ${salida.codigo} fue rechazada.${rejectDto.motivo ? ' Motivo: ' + rejectDto.motivo : ''}`,
            '/gestionar-salida');
        return result;
    }

    async getCatalogos(user?: users) {
        const [municipios, ips, ipsActores, entidades, eapb, eapbActores, organizaciones, idsn, areas] = await Promise.all([
            this.prisma.municipios.findMany({ orderBy: { name: 'asc' } }),
            this.prisma.ips.findMany({ orderBy: { type: 'asc' } }),
            this.prisma.ips_actores.findMany({ orderBy: { name: 'asc' } }),
            this.prisma.entidades.findMany({ orderBy: { name: 'asc' } }),
            this.prisma.eapb.findMany({ orderBy: { name: 'asc' } }),
            this.prisma.eapb_actores.findMany({ orderBy: { name: 'asc' } }),
            this.prisma.organizaciones.findMany({ orderBy: { name: 'asc' } }),
            this.prisma.idsn.findMany({ orderBy: { name: 'asc' } }),
            this.prisma.areas.findMany({ orderBy: { name: 'asc' }, include: { subdirecciones: { select: { id: true, name: true } } } })
        ]);

        const subdirecciones = await this.prisma.subdirecciones.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } });

        let lideres: { id: string, name: string, area_id?: string }[] | undefined;

        if (user) {
            const userType = await this.prisma.user_types.findUnique({ where: { id: user.user_type_id } });
            const liderRole = await this.prisma.user_types.findUnique({ where: { name: 'lider' } });

            if (liderRole && (userType?.name === 'admin_subdireccion' || userType?.name === 'superadmin')) {
                let lideresWhere: any = { user_type_id: liderRole.id, is_active: true };

                if (userType.name === 'admin_subdireccion') {
                    const subdireccionId = await this.userContext.getUserSubdireccionId(user);
                    if (subdireccionId) lideresWhere.areas = { subdireccion_id: subdireccionId };
                }

                const lideresRaw = await this.prisma.users.findMany({
                    where: lideresWhere, select: { id: true, names: true, last_name: true, area_id: true }
                });
                lideres = lideresRaw.map(l => ({ id: l.id, name: `${l.names} ${l.last_name}`, area_id: l.area_id || undefined }));
            }
        }

        return { municipios, ips, ipsActores, entidades, eapb, eapbActores, organizaciones, idsn, areas, subdirecciones, ...(lideres ? { lideres } : {}) };
    }

    async getEstadisticas(user: users, startDate?: string, endDate?: string, areaId?: string, estado?: string, jornada?: string, subdireccionId?: string, tipo?: string, subtipo?: string) {
        const where: any = {};
        if (areaId) where.area_id = areaId;
        if (estado) where.estado = estado;
        if (jornada) where.jornada = jornada;
        if (subdireccionId) where.areas = { subdireccion_id: subdireccionId };
        if (tipo) where.tipo_salida = tipo;
        if (subtipo) where.subtipo_salida = { contains: subtipo };

        if (startDate && endDate) {
            where.fecha_inicio = { gte: new Date(`${startDate}T00:00:00`), lte: new Date(`${endDate}T23:59:59.999`) };
        } else if (startDate) {
            where.fecha_inicio = { gte: new Date(`${startDate}T00:00:00`) };
        } else if (endDate) {
            where.fecha_inicio = { lte: new Date(`${endDate}T23:59:59.999`) };
        }

        const [byEstado, bySolicitante, byArea] = await Promise.all([
            this.prisma.salidas.groupBy({ by: ['estado'], where, _count: { _all: true } }),
            this.prisma.salidas.groupBy({ by: ['solicitante_id'], where, _count: { _all: true }, orderBy: { _count: { solicitante_id: 'desc' } }, take: 10 }),
            this.prisma.salidas.groupBy({ by: ['area_id'], where, _count: { _all: true } }),
        ]);

        const [usersInfo, areaInfo, items] = await Promise.all([
            this.prisma.users.findMany({ where: { id: { in: bySolicitante.map(s => s.solicitante_id) } }, select: { id: true, names: true, last_name: true } }),
            this.prisma.areas.findMany({ where: { id: { in: byArea.map(a => a.area_id) } }, select: { id: true, name: true } }),
            this.prisma.salidas.findMany({
                where,
                include: {
                    municipios: true, salida_ips: { include: { ips: true, actor: true } }, entidades: true,
                    salida_eapb: { include: { eapb: true, actor: true } },
                    organizaciones: true, idsn: true,
                    solicitante: { select: { id: true, names: true, last_name: true, email: true } },
                    aprobador: { select: { id: true, names: true, last_name: true, email: true } },
                    areas: { select: { id: true, name: true, subdireccion_id: true, subdirecciones: { select: { id: true, name: true } } } },
                    areas_participantes: { select: { id: true, name: true, subdireccion_id: true, subdirecciones: { select: { id: true, name: true } } } },
                    lugar_evento: true
                },
                orderBy: { fecha_inicio: 'desc' }
            }),
        ]);

        const porTipo = Object.entries(
            items.reduce((acc: Record<string, number>, item: any) => {
                const key = item.tipo_salida || 'Sin tipo';
                acc[key] = (acc[key] || 0) + 1;
                return acc;
            }, {})
        ).map(([name, count]) => ({ name, count }));

        const porSubtipo = Object.entries(
            items.reduce((acc: Record<string, number>, item: any) => {
                const subtipos = (item.subtipo_salida || '').split(',').map((s: string) => s.trim()).filter(Boolean);
                for (const s of subtipos) {
                    acc[s] = (acc[s] || 0) + 1;
                }
                return acc;
            }, {})
        ).map(([name, count]) => ({ name, count }));

        const porSubdireccion = Object.entries(
            items.reduce((acc: Record<string, number>, item: any) => {
                const key = item.areas?.subdirecciones?.name || 'Sin subdirección';
                acc[key] = (acc[key] || 0) + 1;
                return acc;
            }, {})
        ).map(([name, count]) => ({ name, count }));

        return {
            estados: byEstado.map(e => ({ name: e.estado, count: e._count._all })),
            topSolicitantes: bySolicitante.map(s => {
                const u = usersInfo.find(u => u.id === s.solicitante_id);
                return { name: u ? `${u.names} ${u.last_name}` : 'Desconocido', count: s._count._all };
            }),
            areas: byArea.map(a => {
                const i = areaInfo.find(area => area.id === a.area_id);
                return { name: i ? i.name : 'Desconocido', count: a._count._all };
            }),
            porTipo,
            porSubtipo,
            porSubdireccion,
            total: byEstado.reduce((acc, curr) => acc + curr._count._all, 0),
            items
        };
    }

    // ── PDF Export ────────────────────────────────────────────────────────────

    async exportEstadisticasPdf(user: users, startDate?: string, endDate?: string, areaId?: string, estado?: string, jornada?: string, subdireccionId?: string, tipo?: string, subtipo?: string) {
        const data = await this.getEstadisticas(user, startDate, endDate, areaId, estado, jornada, subdireccionId, tipo, subtipo);
        const area = areaId ? await this.prisma.areas.findUnique({ where: { id: areaId }, select: { name: true } }) : null;

        return this.pdfReport.generate(data, {
            startDate, endDate, areaName: area?.name, estado, jornada,
            authorName: `${user.names} ${user.last_name}`,
        });
    }

    async exportEstadisticasExcel(user: users, startDate?: string, endDate?: string, areaId?: string, estado?: string, jornada?: string, subdireccionId?: string, tipo?: string, subtipo?: string) {
        const data = await this.getEstadisticas(user, startDate, endDate, areaId, estado, jornada, subdireccionId, tipo, subtipo);
        const area = areaId ? await this.prisma.areas.findUnique({ where: { id: areaId }, select: { name: true } }) : null;

        return this.excelReport.generate(data, {
            startDate, endDate, areaName: area?.name, estado, jornada,
            authorName: `${user.names} ${user.last_name}`,
        });
    }

    // ── Bulk Operations ───────────────────────────────────────────────────────

    async bulkApprove(dto: BulkApproveSalidaDto, user: users) {
        const userType = await this.prisma.user_types.findUnique({ where: { id: user.user_type_id } });
        if (!['admin_subdireccion', 'superadmin'].includes(userType?.name || ''))
            throw new ForbiddenException('No autorizado para aprobar salidas');

        const salidas = await this.prisma.salidas.findMany({ where: { id: { in: dto.ids } }, include: { areas: true } });
        const results: { aprobadas: string[]; errores: { id: string; codigo: string; motivo: string }[] } = { aprobadas: [], errores: [] };
        const validIds: string[] = [];
        const subdireccionId = userType?.name === 'admin_subdireccion' ? await this.userContext.getUserSubdireccionId(user) : null;

        for (const salida of salidas) {
            if (salida.estado !== 'pendiente') { results.errores.push({ id: salida.id, codigo: salida.codigo, motivo: `Estado actual: ${salida.estado}` }); continue; }
            if (userType?.name === 'admin_subdireccion') {
                const userArea = subdireccionId ? { subdireccion_id: subdireccionId } : null;
                if (salida.areas.subdireccion_id !== userArea?.subdireccion_id) { results.errores.push({ id: salida.id, codigo: salida.codigo, motivo: 'No pertenece a su subdirección' }); continue; }
            }
            validIds.push(salida.id);
        }

        dto.ids.filter(id => !salidas.map(s => s.id).includes(id))
            .forEach(id => results.errores.push({ id, codigo: 'N/A', motivo: 'Salida no encontrada' }));

        if (validIds.length > 0) {
            await this.prisma.salidas.updateMany({
                where: { id: { in: validIds } },
                data: { estado: 'aprobada', fecha_aprobacion: new Date(), aprobador_id: user.id, observaciones: dto.observaciones || null }
            });
            results.aprobadas = validIds;
        }

        return results;
    }

    async setSeguimiento(id: string, dto: SetSeguimientoDto, user: users) {
        await this.findOne(id, user);

        return this.prisma.seguimiento_capacitaciones.upsert({
            where: { salida_id: id },

            create: {
                salida_id: id,
                se_realizo: dto.se_realizo,
                num_instituciones_asistieron: dto.num_instituciones_asistieron ?? null,
                num_total_asistentes: dto.num_total_asistentes ?? null,
                evaluacion_satisfaccion: dto.evaluacion_satisfaccion ?? null,
                observaciones: dto.observaciones ?? null,
            },
            update: {
                se_realizo: dto.se_realizo,
                num_instituciones_asistieron: dto.num_instituciones_asistieron ?? null,
                num_total_asistentes: dto.num_total_asistentes ?? null,
                evaluacion_satisfaccion: dto.evaluacion_satisfaccion ?? null,
                observaciones: dto.observaciones ?? null,
            }
        })
    }

    async setSeguimientoArticulacionIv(id: string, dto: SetSeguimientoArticulacionIvDto, user: users) {
        await this.findOne(id, user);

        return this.prisma.seguimiento_articulacion_iv.upsert({
            where: { salida_id: id },
            create: {
                salida_id: id,
                se_realizo_vsp: dto.se_realizo_vsp,
                observaciones: dto.observaciones ?? null,
            },
            update: {
                se_realizo_vsp: dto.se_realizo_vsp,
                observaciones: dto.observaciones ?? null,
            }
        });
    }

    async setSeguimientoIvc(id: string, dto: SetSeguimientoIvcDto, user: users) {
        await this.findOne(id, user);

        const fechaAutocomisorio = dto.fecha_autocomisorio ? new Date(dto.fecha_autocomisorio) : null;

        return this.prisma.seguimiento_ivc.upsert({
            where: { salida_id: id },
            create: {
                salida_id: id,
                se_realizo: dto.se_realizo,
                num_autocomisorio: dto.num_autocomisorio ?? null,
                fecha_autocomisorio: fechaAutocomisorio,
                observaciones: dto.observaciones ?? null,
            },
            update: {
                se_realizo: dto.se_realizo,
                num_autocomisorio: dto.num_autocomisorio ?? null,
                fecha_autocomisorio: fechaAutocomisorio,
                observaciones: dto.observaciones ?? null,
            }
        });
    }

    async setSeguimientoAcompanamiento(id: string, dto: SetSeguimientoAcompanamientoDto, user: users) {
        await this.findOne(id, user);

        const existente = await this.prisma.seguimiento_acompanamiento.findUnique({ where: { salida_id: id }, select: { archivo_manual_nombre: true } });
        if (existente?.archivo_manual_nombre) {
            throw new BadRequestException('No se puede diligenciar el formulario porque ya se subió un acta escaneada para esta programación');
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

        return this.prisma.seguimiento_acompanamiento.upsert({
            where: { salida_id: id },
            create: { salida_id: id, ...data },
            update: data,
            select: this.seguimientoAcompanamientoSelect,
        });
    }

    async generateCertificadoAcompanamiento(id: string, user: users): Promise<Buffer> {
        const salida = await this.findOne(id, user);
        return this.acompanamientoCertificate.generate(salida);
    }

    async uploadActaAcompanamiento(id: string, file: Express.Multer.File, user: users) {
        if (!file) throw new BadRequestException('No se recibió ningún archivo');
        await this.findOne(id, user);

        const existente = await this.prisma.seguimiento_acompanamiento.findUnique({ where: { salida_id: id }, select: { se_realizo: true, archivo_manual_nombre: true } });
        if (existente?.se_realizo && !existente.archivo_manual_nombre) {
            throw new BadRequestException('No se puede subir un acta escaneada porque ya se generó el acta por formulario');
        }

        const archivo = new Uint8Array(file.buffer);

        return this.prisma.seguimiento_acompanamiento.upsert({
            where: { salida_id: id },
            create: {
                salida_id: id,
                se_programo: true,
                se_realizo: true,
                archivo_manual: archivo,
                archivo_manual_nombre: file.originalname,
            },
            update: {
                archivo_manual: archivo,
                archivo_manual_nombre: file.originalname,
            },
            select: this.seguimientoAcompanamientoSelect,
        });
    }

    async getActaArchivoAcompanamiento(id: string, user: users): Promise<{ buffer: Buffer; nombre: string }> {
        await this.findOne(id, user);
        const seguimiento = await this.prisma.seguimiento_acompanamiento.findUnique({
            where: { salida_id: id },
            select: { archivo_manual: true, archivo_manual_nombre: true },
        });
        if (!seguimiento?.archivo_manual) throw new NotFoundException('No hay un acta escaneada cargada para esta programación');
        return { buffer: Buffer.from(seguimiento.archivo_manual), nombre: seguimiento.archivo_manual_nombre || `acta-${id}.pdf` };
    }

    async bulkReject(dto: BulkRejectSalidaDto, user: users) {
        const userType = await this.prisma.user_types.findUnique({ where: { id: user.user_type_id } });
        if (!['admin_subdireccion', 'superadmin'].includes(userType?.name || ''))
            throw new ForbiddenException('No autorizado para rechazar salidas');

        const salidas = await this.prisma.salidas.findMany({ where: { id: { in: dto.ids } }, include: { areas: true } });
        const results: { rechazadas: string[]; errores: { id: string; codigo: string; motivo: string }[] } = { rechazadas: [], errores: [] };
        const validIds: string[] = [];
        const subdireccionId = userType?.name === 'admin_subdireccion' ? await this.userContext.getUserSubdireccionId(user) : null;

        for (const salida of salidas) {
            const canReject = salida.estado === 'pendiente' || (salida.estado === 'aprobada' && userType?.name === 'superadmin');
            if (!canReject) { results.errores.push({ id: salida.id, codigo: salida.codigo, motivo: `Estado actual: ${salida.estado}` }); continue; }
            if (userType?.name === 'admin_subdireccion') {
                const userArea = subdireccionId ? { subdireccion_id: subdireccionId } : null;
                if (salida.areas.subdireccion_id !== userArea?.subdireccion_id) { results.errores.push({ id: salida.id, codigo: salida.codigo, motivo: 'No pertenece a su subdirección' }); continue; }
            }
            validIds.push(salida.id);
        }

        dto.ids.filter(id => !salidas.map(s => s.id).includes(id))
            .forEach(id => results.errores.push({ id, codigo: 'N/A', motivo: 'Salida no encontrada' }));

        if (validIds.length > 0) {
            await this.prisma.salidas.updateMany({
                where: { id: { in: validIds } },
                data: { estado: 'rechazada', fecha_aprobacion: new Date(), aprobador_id: user.id, observaciones: dto.motivo }
            });
            results.rechazadas = validIds;
        }

        return results;
    }


}
