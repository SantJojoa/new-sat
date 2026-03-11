import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSalidaDto } from './dto/create-salida.dto';
import { UpdateSalidaDto } from './dto/update-salida.dto';
import { ApproveSalidaDto, RejectSalidaDto, BulkApproveSalidaDto, BulkRejectSalidaDto } from './dto/aprove-salida.dto';
import { users } from '@prisma/client';
import { SalidasPdfReport } from './reports/salidas-pdf.report';

@Injectable()
export class SalidasService {
    constructor(
        private prisma: PrismaService,
        private pdfReport: SalidasPdfReport,  // ← inyectado
    ) { }

    private parseDateLocal(dateStr: string | Date): Date {
        if (dateStr instanceof Date) return dateStr;
        if (dateStr.includes('T')) return new Date(dateStr);
        return new Date(`${dateStr}T12:00:00`);
    }

    private async checkConflicts(
        start: Date, end: Date, jornada: string,
        municipios: string[] = [], ips: string[] = [],
        entidades: string[] = [], eapb: string[] = [],
        organizaciones: string[] = [], idsn: string[] = [],
        excludeId?: string
    ) {
        const jornadaFilter = jornada === 'Completa'
            ? {}
            : { OR: [{ jornada: 'Completa' }, { jornada: jornada }] };

        const whereClause: any = {
            AND: [
                { fecha_inicio: { lte: end }, fecha_final: { gte: start } },
                { estado: { in: ['aprobada', 'pendiente'] } },
                jornadaFilter,
                {
                    OR: [
                        { municipios: { some: { id: { in: municipios } } } },
                        { ips: { some: { id: { in: ips } } } },
                        { entidades: { some: { id: { in: entidades } } } },
                        { eapb: { some: { id: { in: eapb } } } },
                        { organizaciones: { some: { id: { in: organizaciones } } } },
                        { idsn: { some: { id: { in: idsn } } } },
                    ]
                }
            ]
        };

        if (excludeId) whereClause.AND.push({ id: { not: excludeId } });

        const conflicts = await this.prisma.salidas.findMany({
            where: whereClause,
            include: {
                solicitante: true, areas: true, municipios: true,
                ips: true, entidades: true, eapb: true, organizaciones: true, idsn: true
            }
        });

        if (conflicts.length > 0) {
            throw new ConflictException({
                message: `Se encontraron ${conflicts.length} actividad(es) en conflicto`,
                conflicts: conflicts.map(c => ({
                    codigo: c.codigo, tipo_salida: c.tipo_salida, tema: c.tema,
                    fecha_inicio: c.fecha_inicio, fecha_final: c.fecha_final, jornada: c.jornada,
                    area: c.areas.name,
                    solicitante: `${c.solicitante.names} ${c.solicitante.last_name}`,
                    municipios: c.municipios.map(m => m.name), ips: c.ips.map(m => m.name),
                    entidades: c.entidades.map(m => m.name), eapb: c.eapb.map(m => m.name),
                    organizaciones: c.organizaciones.map(m => m.name), idsn: c.idsn.map(m => m.name),
                }))
            });
        }
    }

    async create(createSalidaDto: CreateSalidaDto, user: users) {
        const today = new Date();
        const todayStr = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().split('T')[0];

        if (createSalidaDto.fecha_inicio < todayStr)
            throw new BadRequestException('No se puede programar una salida en una fecha anterior a la actual');

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

        await this.checkConflicts(
            this.parseDateLocal(createSalidaDto.fecha_inicio), this.parseDateLocal(createSalidaDto.fecha_final),
            createSalidaDto.jornada, createSalidaDto.municipios_ids, createSalidaDto.ips_ids,
            createSalidaDto.entidades_ids, createSalidaDto.eapb_ids, createSalidaDto.organizaciones_ids, createSalidaDto.idsn_ids
        );

        let municipiosConvocadosStr: string | undefined;
        if (createSalidaDto.municipios_ids?.length) {
            const munis = await this.prisma.municipios.findMany({ where: { id: { in: createSalidaDto.municipios_ids } }, select: { name: true } });
            municipiosConvocadosStr = munis.map(m => m.name).join(', ');
        }

        return this.prisma.salidas.create({
            data: {
                codigo: newCodigo, tipo_salida: createSalidaDto.tipo_salida, subtipo_salida: createSalidaDto.subtipo_salida,
                tema: createSalidaDto.tema, descripcion: createSalidaDto.descripcion,
                fecha_inicio: this.parseDateLocal(createSalidaDto.fecha_inicio),
                fecha_final: this.parseDateLocal(createSalidaDto.fecha_final),
                jornada: createSalidaDto.jornada, estado: 'pendiente',
                solicitante_id: createSalidaDto.solicitante_id || user.id, area_id: targetAreaId,
                transporte_medio: createSalidaDto.transporte_medio, transporte_responsables: createSalidaDto.transporte_responsables,
                instituciones_convocadas: createSalidaDto.instituciones_convocadas,
                municipios_convocados: municipiosConvocadosStr, lugar_evento_id: createSalidaDto.lugar_evento_id,
                municipios: { connect: createSalidaDto.municipios_ids?.map(id => ({ id })) || [] },
                ips: { connect: createSalidaDto.ips_ids?.map(id => ({ id })) || [] },
                entidades: { connect: createSalidaDto.entidades_ids?.map(id => ({ id })) || [] },
                eapb: { connect: createSalidaDto.eapb_ids?.map(id => ({ id })) || [] },
                organizaciones: { connect: createSalidaDto.organizaciones_ids?.map(id => ({ id })) || [] },
                idsn: { connect: createSalidaDto.idsn_ids?.map(id => ({ id })) || [] }
            },
            include: {
                municipios: true, ips: true, entidades: true, eapb: true, organizaciones: true, idsn: true,
                solicitante: { select: { id: true, names: true, email: true } },
                areas: { select: { id: true, name: true } }
            }
        });
    }

    async findAll(user: users, viewAll: boolean = false) {
        const include = {
            municipios: true, ips: true, entidades: true, eapb: true, organizaciones: true, idsn: true,
            solicitante: { select: { id: true, names: true, email: true } },
            aprobador: { select: { id: true, names: true, email: true } },
            areas: { select: { id: true, name: true, subdireccion_id: true, subdirecciones: { select: { id: true, name: true } } } },
            lugar_evento: true
        };

        const userType = await this.prisma.user_types.findUnique({ where: { id: user.user_type_id } });
        if (!userType) throw new ForbiddenException('Tipo no encontrado');

        let where: any = {};
        if (!viewAll) {
            if (userType.name === 'admin_subdireccion') {
                const userArea = await this.prisma.areas.findUnique({ where: { id: user.area_id! }, include: { subdirecciones: true } });
                if (!userArea) throw new ForbiddenException('Área no encontrada');
                where = { areas: { subdireccion_id: userArea.subdireccion_id } };
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
                municipios: true, ips: true, entidades: true, eapb: true, organizaciones: true, idsn: true,
                solicitante: { select: { id: true, names: true, email: true } },
                aprobador: { select: { id: true, names: true, email: true } },
                areas: { select: { id: true, name: true, subdireccion_id: true } }
            }
        });

        if (!salida) throw new NotFoundException(`Salida ${id} no encontrada`);

        const userType = await this.prisma.user_types.findUnique({ where: { id: user.user_type_id } });

        if (userType?.name === 'admin_subdireccion') {
            const userArea = await this.prisma.areas.findUnique({ where: { id: user.area_id! } });
            if (salida.areas.subdireccion_id !== userArea?.subdireccion_id)
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
                updateSalidaDto.fecha_inicio ? this.parseDateLocal(updateSalidaDto.fecha_inicio) : salida.fecha_inicio,
                updateSalidaDto.fecha_final ? this.parseDateLocal(updateSalidaDto.fecha_final) : salida.fecha_final,
                updateSalidaDto.jornada || salida.jornada,
                updateSalidaDto.municipios_ids || salida.municipios.map(m => m.id),
                updateSalidaDto.ips_ids || salida.ips.map(m => m.id),
                updateSalidaDto.entidades_ids || salida.entidades.map(m => m.id),
                updateSalidaDto.eapb_ids || salida.eapb.map(m => m.id),
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
                fecha_inicio: updateSalidaDto.fecha_inicio ? this.parseDateLocal(updateSalidaDto.fecha_inicio) : undefined,
                fecha_final: updateSalidaDto.fecha_final ? this.parseDateLocal(updateSalidaDto.fecha_final) : undefined,
                jornada: updateSalidaDto.jornada, transporte_medio: updateSalidaDto.transporte_medio,
                transporte_responsables: updateSalidaDto.transporte_responsables,
                instituciones_convocadas: updateSalidaDto.instituciones_convocadas,
                municipios_convocados: municipiosConvocadosStr, lugar_evento_id: updateSalidaDto.lugar_evento_id,
                estado: updateSalidaDto.estado,
                observaciones: updateSalidaDto.observaciones_aprobacion
                    ? `${salida.observaciones || ''}\n${updateSalidaDto.observaciones_aprobacion}` : undefined,
                municipios: updateSalidaDto.municipios_ids ? { set: updateSalidaDto.municipios_ids.map(id => ({ id })) } : undefined,
                ips: updateSalidaDto.ips_ids ? { set: updateSalidaDto.ips_ids.map(id => ({ id })) } : undefined,
                entidades: updateSalidaDto.entidades_ids ? { set: updateSalidaDto.entidades_ids.map(id => ({ id })) } : undefined,
                eapb: updateSalidaDto.eapb_ids ? { set: updateSalidaDto.eapb_ids.map(id => ({ id })) } : undefined,
                organizaciones: updateSalidaDto.organizaciones_ids ? { set: updateSalidaDto.organizaciones_ids.map(id => ({ id })) } : undefined,
                idsn: updateSalidaDto.idsn_ids ? { set: updateSalidaDto.idsn_ids.map(id => ({ id })) } : undefined,
            },
            include: { municipios: true, ips: true, entidades: true, eapb: true, organizaciones: true, idsn: true }
        });
    }

    async remove(id: string, user: users) {
        const salida = await this.findOne(id, user);
        const userType = await this.prisma.user_types.findUnique({ where: { id: user.user_type_id } });
        if (salida.estado !== 'pendiente' && userType?.name !== 'superadmin')
            throw new BadRequestException('Solo pendientes se pueden eliminar');
        return this.prisma.salidas.delete({ where: { id } });
    }

    async approve(id: string, user: users, approveDto: ApproveSalidaDto) {
        const salida = await this.findOne(id, user);
        if (salida.estado !== 'pendiente') throw new BadRequestException('La salida no está pendiente');
        const userType = await this.prisma.user_types.findUnique({ where: { id: user.user_type_id } });
        if (!['admin_subdireccion', 'superadmin'].includes(userType?.name || '')) throw new ForbiddenException('No autorizado');
        return this.prisma.salidas.update({
            where: { id },
            data: { estado: 'aprobada', fecha_aprobacion: new Date(), aprobador_id: user.id, observaciones: approveDto.observaciones }
        });
    }

    async reject(id: string, user: users, rejectDto: RejectSalidaDto) {
        const salida = await this.findOne(id, user);
        const userType = await this.prisma.user_types.findUnique({ where: { id: user.user_type_id } });
        const canReject = salida.estado === 'pendiente' || (salida.estado === 'aprobada' && userType?.name === 'superadmin');
        if (!canReject) throw new BadRequestException('No se puede rechazar en el estado actual');
        if (!['admin_subdireccion', 'superadmin'].includes(userType?.name || '')) throw new ForbiddenException('No autorizado');
        return this.prisma.salidas.update({
            where: { id },
            data: { estado: 'rechazada', fecha_aprobacion: new Date(), aprobador_id: user.id, observaciones: rejectDto.motivo }
        });
    }

    async getCatalogos(user?: users) {
        const [municipios, ips, entidades, eapb, organizaciones, idsn, areas] = await Promise.all([
            this.prisma.municipios.findMany({ orderBy: { name: 'asc' } }),
            this.prisma.ips.findMany({ orderBy: { name: 'asc' } }),
            this.prisma.entidades.findMany({ orderBy: { name: 'asc' } }),
            this.prisma.eapb.findMany({ orderBy: { name: 'asc' } }),
            this.prisma.organizaciones.findMany({ orderBy: { name: 'asc' } }),
            this.prisma.idsn.findMany({ orderBy: { name: 'asc' } }),
            this.prisma.areas.findMany({ orderBy: { name: 'asc' } })
        ]);

        let lideres: { id: string, name: string, area_id?: string }[] | undefined;

        if (user) {
            const userType = await this.prisma.user_types.findUnique({ where: { id: user.user_type_id } });
            const liderRole = await this.prisma.user_types.findUnique({ where: { name: 'lider' } });

            if (liderRole && (userType?.name === 'admin_subdireccion' || userType?.name === 'superadmin')) {
                let lideresWhere: any = { user_type_id: liderRole.id, is_active: true };

                if (userType.name === 'admin_subdireccion' && user.area_id) {
                    const userArea = await this.prisma.areas.findUnique({ where: { id: user.area_id }, select: { subdireccion_id: true } });
                    if (userArea?.subdireccion_id) lideresWhere.areas = { subdireccion_id: userArea.subdireccion_id };
                }

                const lideresRaw = await this.prisma.users.findMany({
                    where: lideresWhere, select: { id: true, names: true, last_name: true, area_id: true }
                });
                lideres = lideresRaw.map(l => ({ id: l.id, name: `${l.names} ${l.last_name}`, area_id: l.area_id || undefined }));
            }
        }

        return { municipios, ips, entidades, eapb, organizaciones, idsn, areas, ...(lideres ? { lideres } : {}) };
    }

    async getEstadisticas(user: users, startDate?: string, endDate?: string, areaId?: string, estado?: string, jornada?: string) {
        const where: any = {};
        if (areaId) where.area_id = areaId;
        if (estado) where.estado = estado;
        if (jornada) where.jornada = jornada;

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
                    municipios: true, ips: true, entidades: true, eapb: true, organizaciones: true, idsn: true,
                    solicitante: { select: { id: true, names: true, last_name: true, email: true } },
                    aprobador: { select: { id: true, names: true, last_name: true, email: true } },
                    areas: { select: { id: true, name: true, subdireccion_id: true } },
                    lugar_evento: true
                },
                orderBy: { fecha_inicio: 'desc' }
            }),
        ]);

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
            total: byEstado.reduce((acc, curr) => acc + curr._count._all, 0),
            items
        };
    }

    // ── PDF Export ────────────────────────────────────────────────────────────

    async exportEstadisticasPdf(user: users, startDate?: string, endDate?: string, areaId?: string, estado?: string, jornada?: string) {
        const data = await this.getEstadisticas(user, startDate, endDate, areaId, estado, jornada);
        const area = areaId ? await this.prisma.areas.findUnique({ where: { id: areaId }, select: { name: true } }) : null;

        return this.pdfReport.generate(data, {
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

        for (const salida of salidas) {
            if (salida.estado !== 'pendiente') { results.errores.push({ id: salida.id, codigo: salida.codigo, motivo: `Estado actual: ${salida.estado}` }); continue; }
            if (userType?.name === 'admin_subdireccion') {
                const userArea = await this.prisma.areas.findUnique({ where: { id: user.area_id! } });
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

    async bulkReject(dto: BulkRejectSalidaDto, user: users) {
        const userType = await this.prisma.user_types.findUnique({ where: { id: user.user_type_id } });
        if (!['admin_subdireccion', 'superadmin'].includes(userType?.name || ''))
            throw new ForbiddenException('No autorizado para rechazar salidas');

        const salidas = await this.prisma.salidas.findMany({ where: { id: { in: dto.ids } }, include: { areas: true } });
        const results: { rechazadas: string[]; errores: { id: string; codigo: string; motivo: string }[] } = { rechazadas: [], errores: [] };
        const validIds: string[] = [];

        for (const salida of salidas) {
            const canReject = salida.estado === 'pendiente' || (salida.estado === 'aprobada' && userType?.name === 'superadmin');
            if (!canReject) { results.errores.push({ id: salida.id, codigo: salida.codigo, motivo: `Estado actual: ${salida.estado}` }); continue; }
            if (userType?.name === 'admin_subdireccion') {
                const userArea = await this.prisma.areas.findUnique({ where: { id: user.area_id! } });
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
