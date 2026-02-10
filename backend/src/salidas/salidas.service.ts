import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSalidaDto } from './dto/create-salida.dto';
import { UpdateSalidaDto } from './dto/update-salida.dto';
import { ApproveSalidaDto, RejectSalidaDto, BulkApproveSalidaDto, BulkRejectSalidaDto } from './dto/aprove-salida.dto';
import { users } from '@prisma/client';

@Injectable()
export class SalidasService {
    constructor(private prisma: PrismaService) { }

    private async checkConflicts(
        start: Date,
        end: Date,
        jornada: string,
        municipios: string[] = [],
        ips: string[] = [],
        entidades: string[] = [],
        eapb: string[] = [],
        organizaciones: string[] = [],
        excludeId?: string
    ) {
        // Validation logic:
        // 1. Date Overlap
        // 2. Jornada Overlap (Same, or 'Completa' overlaps everything)
        // 3. Entity Overlap (Any match in the lists)

        const jornadaConditions: any[] = [
            { jornada: 'Completa' }, // Existing is full day
        ];
        if (jornada === 'Completa') {
            // New is full day -> All existing clash
            // (Covered by general query, essentially we don't filter by jornada if new is complete, match any)
        } else {
            jornadaConditions.push({ jornada: jornada }); // Exact match
        }

        // Use OR for jornada collision: 
        // (Existing is 'Completa') OR (New is 'Completa') OR (Existing == New)
        // In Prisma 'OR', we list conditions.
        // If new is 'Completa', we verify against ALL jornadas.

        const jornadaFilter = jornada === 'Completa'
            ? {} // No filter, match all
            : { OR: [{ jornada: 'Completa' }, { jornada: jornada }] };

        const whereClause: any = {
            AND: [
                {
                    // Date overlap: (StartA <= EndB) and (EndA >= StartB)
                    fecha_inicio: { lte: end },
                    fecha_final: { gte: start },
                },
                jornadaFilter,
                {
                    OR: [
                        { municipios: { some: { id: { in: municipios } } } },
                        { ips: { some: { id: { in: ips } } } },
                        { entidades: { some: { id: { in: entidades } } } },
                        { eapb: { some: { id: { in: eapb } } } },
                        { organizaciones: { some: { id: { in: organizaciones } } } },
                    ]
                }
            ]
        };

        if (excludeId) {
            whereClause.AND.push({ id: { not: excludeId } });
        }

        const conflict = await this.prisma.salidas.findFirst({
            where: whereClause,
            include: {
                solicitante: true,
                areas: true,
                municipios: true
            }
        });

        if (conflict) {
            throw new ConflictException(
                `Conflicto detectado: La salida ${conflict.codigo} del área ${conflict.areas.name} ya tiene programada una actividad en esa fecha/jornada con las entidades seleccionadas.`
            );
        }
    }

    async create(createSalidaDto: CreateSalidaDto, user: users) {
        if (!user.area_id) {
            throw new BadRequestException('El usuario no tiene un área asignada');
        }

        // Auto-generate code if not provided (though it should always be auto-generated now)
        // Format: YYYYMMDD-AAA##

        // 1. Get User's Area Name
        const userArea = await this.prisma.areas.findUnique({
            where: { id: user.area_id },
            select: { name: true }
        });

        if (!userArea) throw new BadRequestException('El usuario no tiene un área válida asignada');

        // 2. Generate Parts
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const dateStr = `${year}${month}${day}`;

        const areaCode = userArea.name.substring(0, 3).toUpperCase();

        // 3. Count existing for this Area + Day to get consecutive
        // We need to count how many salidas have a code starting with YYYYMMDD-AAA
        // simpler: findMany with startsWith and count? Or count directly.
        // We need to match the pattern.

        const pattern = `${dateStr}-${areaCode}`;

        const count = await this.prisma.salidas.count({
            where: {
                codigo: {
                    startsWith: pattern
                }
            }
        });

        const consecutive = String(count + 1).padStart(2, '0');
        const newCodigo = `${pattern}${consecutive}`;

        // Verify uniqueness just in case (race condition unlikely but possible)
        const checkUnique = await this.prisma.salidas.findUnique({ where: { codigo: newCodigo } });
        if (checkUnique) {
            // fallback or retry? For now let's just error or add seconds? 
            // With low volume it is fine.
            throw new ConflictException('Error generando código único, intente nuevamente');
        }

        // Check Conflicts
        await this.checkConflicts(
            new Date(createSalidaDto.fecha_inicio),
            new Date(createSalidaDto.fecha_final),
            createSalidaDto.jornada,
            createSalidaDto.municipios_ids,
            createSalidaDto.ips_ids,
            createSalidaDto.entidades_ids,
            createSalidaDto.eapb_ids,
            createSalidaDto.organizaciones_ids
        );

        // Obtener nombres de municipios convocados
        let municipiosConvocadosStr: string | undefined;
        if (createSalidaDto.municipios_ids?.length) {
            const munis = await this.prisma.municipios.findMany({
                where: { id: { in: createSalidaDto.municipios_ids } },
                select: { name: true }
            });
            municipiosConvocadosStr = munis.map(m => m.name).join(', ');
        }

        // Create
        return this.prisma.salidas.create({
            data: {
                codigo: newCodigo,
                tipo_salida: createSalidaDto.tipo_salida,
                subtipo_salida: createSalidaDto.subtipo_salida,
                tema: createSalidaDto.tema,
                descripcion: createSalidaDto.descripcion,
                fecha_inicio: new Date(createSalidaDto.fecha_inicio),
                fecha_final: new Date(createSalidaDto.fecha_final),
                jornada: createSalidaDto.jornada,
                estado: 'pendiente',
                solicitante_id: user.id,
                area_id: user.area_id,

                // Transport Fields
                transporte_medio: createSalidaDto.transporte_medio,
                transporte_responsables: createSalidaDto.transporte_responsables,
                instituciones_convocadas: createSalidaDto.instituciones_convocadas,
                municipios_convocados: municipiosConvocadosStr,
                lugar_evento_id: createSalidaDto.lugar_evento_id,

                // Connect Relations
                municipios: {
                    connect: createSalidaDto.municipios_ids?.map(id => ({ id })) || []
                },
                ips: {
                    connect: createSalidaDto.ips_ids?.map(id => ({ id })) || []
                },
                entidades: {
                    connect: createSalidaDto.entidades_ids?.map(id => ({ id })) || []
                },
                eapb: {
                    connect: createSalidaDto.eapb_ids?.map(id => ({ id })) || []
                },
                organizaciones: {
                    connect: createSalidaDto.organizaciones_ids?.map(id => ({ id })) || []
                }
            },
            include: {
                municipios: true,
                ips: true,
                entidades: true,
                eapb: true,
                organizaciones: true,
                solicitante: { select: { id: true, names: true, email: true } },
                areas: { select: { id: true, name: true } }
            }
        });
    }

    async findAll(user: users, viewAll: boolean = false) {
        // Logic similar to before but with new includes
        const include = {
            municipios: true,
            ips: true,
            entidades: true,
            eapb: true,
            organizaciones: true,
            solicitante: { select: { id: true, names: true, email: true } },
            aprobador: { select: { id: true, names: true, email: true } },
            areas: {
                select: {
                    id: true,
                    name: true,
                    subdireccion_id: true,
                    subdirecciones: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                }
            },
            lugar_evento: true
        };

        const userType = await this.prisma.user_types.findUnique({
            where: { id: user.user_type_id },
        });

        if (!userType) throw new ForbiddenException('Tipo no encontrado');

        let where: any = {};

        // If viewAll is requested, we skip the strict filtering restrictions for admins/area admins
        // BUT we might still strictly respect 'solicitante' (User) vs 'Manager' roles if needed.
        // Assuming "Listar todas" is for people who manage things.

        if (viewAll) {
            // If viewing all, we return everything (no constraints)
            // Unless we want to restrict basic users? 
            // Logic: If user has 'gestionar_salida' permission (checked by Guard), let them see all if they ask.
            where = {};
        } else {
            if (userType.name === 'admin_subdireccion') {
                const userArea = await this.prisma.areas.findUnique({
                    where: { id: user.area_id! },
                    include: { subdirecciones: true },
                });
                if (!userArea) throw new ForbiddenException('Área no encontrada');

                where = {
                    areas: { subdireccion_id: userArea.subdireccion_id }
                };
            } else if (userType.name !== 'superadmin') {
                // Lider/User -> My own requests OR admin_area? 
                // If admin_area falls here, they see only their own?
                // If user wants to see "su area" actions, we might need to handle admin_area explicit filter?
                // For now, preserving existing logic:
                where = { solicitante_id: user.id };
            }
        }

        return this.prisma.salidas.findMany({
            where,
            include,
            orderBy: { fecha_inicio: 'desc' }
        });
    }

    async findOne(id: string, user: users) {
        const salida = await this.prisma.salidas.findUnique({
            where: { id },
            include: {
                municipios: true,
                ips: true,
                entidades: true,
                eapb: true,
                organizaciones: true,
                solicitante: { select: { id: true, names: true, email: true } },
                aprobador: { select: { id: true, names: true, email: true } },
                areas: { select: { id: true, name: true, subdireccion_id: true } }
            }
        });

        if (!salida) throw new NotFoundException(`Salida ${id} no encontrada`);

        // Permission check (same as before)
        const userType = await this.prisma.user_types.findUnique({
            where: { id: user.user_type_id },
        });

        if (userType?.name === 'admin_subdireccion') {
            const userArea = await this.prisma.areas.findUnique({ where: { id: user.area_id! } });
            if (salida.areas.subdireccion_id !== userArea?.subdireccion_id) {
                throw new ForbiddenException('No tienes permiso');
            }
        } else if (userType?.name !== 'superadmin' && salida.solicitante_id !== user.id) {
            throw new ForbiddenException('No tienes permiso');
        }

        return salida;
    }

    async update(id: string, updateSalidaDto: UpdateSalidaDto, user: users) {
        const salida = await this.findOne(id, user);

        if (salida.estado !== 'pendiente') {
            throw new BadRequestException('Solo pendientes se pueden editar');
        }

        const userType = await this.prisma.user_types.findUnique({ where: { id: user.user_type_id } });
        if (salida.solicitante_id !== user.id && userType?.name !== 'superadmin') {
            throw new ForbiddenException('Solo el creador puede editar');
        }

        // Logic to update conflict, dates, etc
        if (updateSalidaDto.fecha_inicio || updateSalidaDto.municipios_ids) {
            // Re-check conflict if critical fields change
            await this.checkConflicts(
                updateSalidaDto.fecha_inicio ? new Date(updateSalidaDto.fecha_inicio) : salida.fecha_inicio,
                updateSalidaDto.fecha_final ? new Date(updateSalidaDto.fecha_final) : salida.fecha_final,
                updateSalidaDto.jornada || salida.jornada,
                updateSalidaDto.municipios_ids || salida.municipios.map(m => m.id),
                updateSalidaDto.ips_ids || salida.ips.map(m => m.id),
                updateSalidaDto.entidades_ids || salida.entidades.map(m => m.id),
                updateSalidaDto.eapb_ids || salida.eapb.map(m => m.id),
                updateSalidaDto.organizaciones_ids || salida.organizaciones.map(m => m.id),
                id
            );
        }

        // Obtener nombres de municipios convocados si se actualizan
        let municipiosConvocadosStr: string | undefined;
        if (updateSalidaDto.municipios_ids?.length) {
            const munis = await this.prisma.municipios.findMany({
                where: { id: { in: updateSalidaDto.municipios_ids } },
                select: { name: true }
            });
            municipiosConvocadosStr = munis.map(m => m.name).join(', ');
        }

        // Prepare data for Prisma update (handling relations is tricky with connect/disconnect)
        // For simplicity, we use set (replace all)
        return this.prisma.salidas.update({
            where: { id },
            data: {
                tipo_salida: updateSalidaDto.tipo_salida,
                subtipo_salida: updateSalidaDto.subtipo_salida,
                tema: updateSalidaDto.tema,
                descripcion: updateSalidaDto.descripcion,
                fecha_inicio: updateSalidaDto.fecha_inicio ? new Date(updateSalidaDto.fecha_inicio) : undefined,
                fecha_final: updateSalidaDto.fecha_final ? new Date(updateSalidaDto.fecha_final) : undefined,
                jornada: updateSalidaDto.jornada,

                // Transport Fields
                transporte_medio: updateSalidaDto.transporte_medio,
                transporte_responsables: updateSalidaDto.transporte_responsables,
                instituciones_convocadas: updateSalidaDto.instituciones_convocadas,
                municipios_convocados: municipiosConvocadosStr,
                lugar_evento_id: updateSalidaDto.lugar_evento_id,

                estado: updateSalidaDto.estado,
                observaciones: updateSalidaDto.observaciones_aprobacion
                    ? `${salida.observaciones || ''}\n${updateSalidaDto.observaciones_aprobacion}`
                    : undefined,

                municipios: updateSalidaDto.municipios_ids ? { set: updateSalidaDto.municipios_ids.map(id => ({ id })) } : undefined,
                ips: updateSalidaDto.ips_ids ? { set: updateSalidaDto.ips_ids.map(id => ({ id })) } : undefined,
                entidades: updateSalidaDto.entidades_ids ? { set: updateSalidaDto.entidades_ids.map(id => ({ id })) } : undefined,
                eapb: updateSalidaDto.eapb_ids ? { set: updateSalidaDto.eapb_ids.map(id => ({ id })) } : undefined,
                organizaciones: updateSalidaDto.organizaciones_ids ? { set: updateSalidaDto.organizaciones_ids.map(id => ({ id })) } : undefined,
            },
            include: {
                municipios: true,
                ips: true,
                entidades: true,
                eapb: true,
                organizaciones: true,
            }
        });
    }

    async remove(id: string, user: users) {
        const salida = await this.findOne(id, user);
        const userType = await this.prisma.user_types.findUnique({ where: { id: user.user_type_id } });

        if (salida.estado !== 'pendiente' && userType?.name !== 'superadmin') {
            throw new BadRequestException('Solo pendientes se pueden eliminar');
        }

        return this.prisma.salidas.delete({ where: { id } });
    }

    async approve(id: string, user: users, approveDto: ApproveSalidaDto) {
        const salida = await this.findOne(id, user);

        if (salida.estado !== 'pendiente') {
            // Usually approval is only for pending. 
            // If superadmin wants to re-approve/update approval? 
            // Let's keep it strict for now unless requested otherwise.
            // User only mentioned rejecting approved ones.
            throw new BadRequestException('La salida no está pendiente');
        }

        const userType = await this.prisma.user_types.findUnique({ where: { id: user.user_type_id } });
        if (!['admin_subdireccion', 'superadmin'].includes(userType?.name || '')) throw new ForbiddenException('No autorizado');

        return this.prisma.salidas.update({
            where: { id },
            data: {
                estado: 'aprobada',
                fecha_aprobacion: new Date(),
                aprobador_id: user.id,
                observaciones: approveDto.observaciones
            }
        });
    }

    async reject(id: string, user: users, rejectDto: RejectSalidaDto) {
        const salida = await this.findOne(id, user);
        const userType = await this.prisma.user_types.findUnique({ where: { id: user.user_type_id } });

        // Allow reject if pending OR (status is approved AND user is superadmin)
        const canReject = salida.estado === 'pendiente' || (salida.estado === 'aprobada' && userType?.name === 'superadmin');

        if (!canReject) {
            throw new BadRequestException('No se puede rechazar en el estado actual');
        }

        if (!['admin_subdireccion', 'superadmin'].includes(userType?.name || '')) throw new ForbiddenException('No autorizado');

        return this.prisma.salidas.update({
            where: { id },
            data: {
                estado: 'rechazada',
                fecha_aprobacion: new Date(),
                aprobador_id: user.id,
                observaciones: rejectDto.motivo
            }
        });
    }

    async getCatalogos() {
        const [municipios, ips, entidades, eapb, organizaciones] = await Promise.all([
            this.prisma.municipios.findMany({ orderBy: { name: 'asc' } }),
            this.prisma.ips.findMany({ orderBy: { name: 'asc' } }),
            this.prisma.entidades.findMany({ orderBy: { name: 'asc' } }),
            this.prisma.eapb.findMany({ orderBy: { name: 'asc' } }),
            this.prisma.organizaciones.findMany({ orderBy: { name: 'asc' } })
        ]);

        return {
            municipios,
            ips,
            entidades,
            eapb,
            organizaciones
        };
    }

    async getEstadisticas(user: users) {
        // Implement valid statistics later or return basics
        return { message: "Calculando estadisticas..." };
    }

    async bulkApprove(dto: BulkApproveSalidaDto, user: users) {
        const userType = await this.prisma.user_types.findUnique({ where: { id: user.user_type_id } });
        if (!['admin_subdireccion', 'superadmin'].includes(userType?.name || '')) {
            throw new ForbiddenException('No autorizado para aprobar salidas');
        }

        const salidas = await this.prisma.salidas.findMany({
            where: { id: { in: dto.ids } },
            include: { areas: true }
        });

        // Validate: only pending salidas can be approved
        const results: { aprobadas: string[]; errores: { id: string; codigo: string; motivo: string }[] } = {
            aprobadas: [],
            errores: []
        };

        const validIds: string[] = [];

        for (const salida of salidas) {
            if (salida.estado !== 'pendiente') {
                results.errores.push({ id: salida.id, codigo: salida.codigo, motivo: `Estado actual: ${salida.estado}` });
                continue;
            }

            // For admin_subdireccion, check subdirection ownership
            if (userType?.name === 'admin_subdireccion') {
                const userArea = await this.prisma.areas.findUnique({ where: { id: user.area_id! } });
                if (salida.areas.subdireccion_id !== userArea?.subdireccion_id) {
                    results.errores.push({ id: salida.id, codigo: salida.codigo, motivo: 'No pertenece a su subdirección' });
                    continue;
                }
            }

            validIds.push(salida.id);
        }

        // Check for IDs not found
        const foundIds = salidas.map(s => s.id);
        const notFound = dto.ids.filter(id => !foundIds.includes(id));
        for (const id of notFound) {
            results.errores.push({ id, codigo: 'N/A', motivo: 'Salida no encontrada' });
        }

        if (validIds.length > 0) {
            await this.prisma.salidas.updateMany({
                where: { id: { in: validIds } },
                data: {
                    estado: 'aprobada',
                    fecha_aprobacion: new Date(),
                    aprobador_id: user.id,
                    observaciones: dto.observaciones || null
                }
            });
            results.aprobadas = validIds;
        }

        return results;
    }

    async bulkReject(dto: BulkRejectSalidaDto, user: users) {
        const userType = await this.prisma.user_types.findUnique({ where: { id: user.user_type_id } });
        if (!['admin_subdireccion', 'superadmin'].includes(userType?.name || '')) {
            throw new ForbiddenException('No autorizado para rechazar salidas');
        }

        const salidas = await this.prisma.salidas.findMany({
            where: { id: { in: dto.ids } },
            include: { areas: true }
        });

        const results: { rechazadas: string[]; errores: { id: string; codigo: string; motivo: string }[] } = {
            rechazadas: [],
            errores: []
        };

        const validIds: string[] = [];

        for (const salida of salidas) {
            // Allow reject if pending, or if approved and superadmin
            const canReject = salida.estado === 'pendiente' || (salida.estado === 'aprobada' && userType?.name === 'superadmin');

            if (!canReject) {
                results.errores.push({ id: salida.id, codigo: salida.codigo, motivo: `Estado actual: ${salida.estado}` });
                continue;
            }

            // For admin_subdireccion, check subdirection ownership
            if (userType?.name === 'admin_subdireccion') {
                const userArea = await this.prisma.areas.findUnique({ where: { id: user.area_id! } });
                if (salida.areas.subdireccion_id !== userArea?.subdireccion_id) {
                    results.errores.push({ id: salida.id, codigo: salida.codigo, motivo: 'No pertenece a su subdirección' });
                    continue;
                }
            }

            validIds.push(salida.id);
        }

        // Check for IDs not found
        const foundIds = salidas.map(s => s.id);
        const notFound = dto.ids.filter(id => !foundIds.includes(id));
        for (const id of notFound) {
            results.errores.push({ id, codigo: 'N/A', motivo: 'Salida no encontrada' });
        }

        if (validIds.length > 0) {
            await this.prisma.salidas.updateMany({
                where: { id: { in: validIds } },
                data: {
                    estado: 'rechazada',
                    fecha_aprobacion: new Date(),
                    aprobador_id: user.id,
                    observaciones: dto.motivo
                }
            });
            results.rechazadas = validIds;
        }

        return results;
    }
}