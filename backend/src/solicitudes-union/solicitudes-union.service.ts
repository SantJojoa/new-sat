import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSolicitudUnionDto, ResolveSolicitudUnionDto } from './dto/solicitudes-union.dto';
import { users } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class SolicitudesUnionService {
    constructor(
        private prisma: PrismaService,
        private notifications: NotificationsService,
    ) { }

    private async getUserSubdireccionId(user: users): Promise<string | null> {
        if (user.subdireccion_id) return user.subdireccion_id;
        if (!user.area_id) return null;
        const userArea = await this.prisma.areas.findUnique({
            where: { id: user.area_id },
            select: { subdireccion_id: true }
        });
        return userArea?.subdireccion_id || null;
    }

    async create(dto: CreateSolicitudUnionDto, user: users) {
        if (!user.area_id) throw new BadRequestException('No tienes un área asignada para enviar la solicitud');

        const salida = await this.prisma.salidas.findUnique({
            where: { id: dto.salida_id },
            include: { areas: { include: { subdirecciones: true } } }
        });
        if (!salida) throw new NotFoundException('Salida no encontrada');

        if (salida.area_id === user.area_id)
            throw new BadRequestException('No puedes solicitar unirte a tu propia salida');

        const existing = await this.prisma.solicitudes_union.findFirst({
            where: {
                salida_id: dto.salida_id,
                solicitante_id: user.id,
                estado: 'pendiente'
            }
        });
        if (existing) throw new BadRequestException('Ya tienes una solicitud de unión pendiente para esta salida');

        const solicitud = await this.prisma.solicitudes_union.create({
            data: {
                salida_id: dto.salida_id,
                solicitante_id: user.id,
                area_solicitante_id: user.area_id,
                mensaje: dto.mensaje,
                estado: 'pendiente'
            },
            include: {
                salida: { select: { id: true, codigo: true, tema: true, fecha_inicio: true, fecha_final: true, areas: { select: { id: true, name: true, subdireccion_id: true } } } },
                solicitante: { select: { id: true, names: true, last_name: true, email: true } },
                area_solicitante: { select: { id: true, name: true } }
            }
        });

        if (solicitud.salida.areas.subdireccion_id) {
            const adminIds = await this.notifications.findAdminsBySubdireccion(solicitud.salida.areas.subdireccion_id);
            const targets = adminIds.filter(id => id !== user.id);
            if (targets.length > 0) {
                await this.notifications.createForMany(targets, 'union_pendiente',
                    'Nueva Solicitud de Unión',
                    `${solicitud.solicitante.names} ${solicitud.solicitante.last_name} (${solicitud.area_solicitante.name}) solicita unirse a la programación ${solicitud.salida.codigo}.`,
                    '/gestionar-salida');
            }
        }
        return solicitud;
    }

    async findAll(user: users) {
        const userType = await this.prisma.user_types.findUnique({ where: { id: user.user_type_id } });
        if (!userType) throw new ForbiddenException('Tipo de usuario no encontrado');

        let where: any = {};

        if (userType.name === 'superadmin') {
            // Superadmin sees all
        } else if (userType.name === 'admin_subdireccion') {
            // Admin sees requests for salidas in their subdirección
            const subdireccionId = await this.getUserSubdireccionId(user);
            if (!subdireccionId) throw new ForbiddenException('No tienes subdirección asignada');
            where = {
                salida: {
                    areas: { subdireccion_id: subdireccionId }
                }
            };
        } else {
            // Regular user sees only their own requests
            where = { solicitante_id: user.id };
        }

        return this.prisma.solicitudes_union.findMany({
            where,
            include: {
                salida: {
                    select: {
                        id: true, codigo: true, tema: true, tipo_salida: true,
                        fecha_inicio: true, fecha_final: true, jornada: true,
                        areas: { select: { id: true, name: true, subdirecciones: { select: { id: true, name: true } } } }
                    }
                },
                solicitante: { select: { id: true, names: true, last_name: true, email: true } },
                area_solicitante: { select: { id: true, name: true } }
            },
            orderBy: { created_at: 'desc' }
        });
    }

    async getPendingCount(user: users): Promise<number> {
        const userType = await this.prisma.user_types.findUnique({ where: { id: user.user_type_id } });
        if (!userType) return 0;

        if (userType.name === 'superadmin') {
            return this.prisma.solicitudes_union.count({ where: { estado: 'pendiente' } });
        }

        if (userType.name === 'admin_subdireccion') {
            const subdireccionId = await this.getUserSubdireccionId(user);
            if (!subdireccionId) return 0;
            return this.prisma.solicitudes_union.count({
                where: {
                    estado: 'pendiente',
                    salida: { areas: { subdireccion_id: subdireccionId } }
                }
            });
        }

        return 0;
    }

    async accept(id: string, dto: ResolveSolicitudUnionDto, user: users) {
        const solicitud = await this.prisma.solicitudes_union.findUnique({
            where: { id },
            include: { salida: { include: { areas: true } } }
        });
        if (!solicitud) throw new NotFoundException('Solicitud no encontrada');
        if (solicitud.estado !== 'pendiente') throw new BadRequestException('La solicitud ya fue procesada');

        const userType = await this.prisma.user_types.findUnique({ where: { id: user.user_type_id } });
        if (!['admin_subdireccion', 'superadmin'].includes(userType?.name || ''))
            throw new ForbiddenException('No autorizado');

        if (userType?.name === 'admin_subdireccion') {
            const subdireccionId = await this.getUserSubdireccionId(user);
            if (solicitud.salida.areas.subdireccion_id !== subdireccionId)
                throw new ForbiddenException('Esta solicitud no pertenece a tu subdirección');
        }

        const [updated] = await this.prisma.$transaction([
            this.prisma.solicitudes_union.update({
                where: { id },
                data: { estado: 'aceptada', respuesta: dto.respuesta },
                include: {
                    salida: { select: { id: true, codigo: true, tema: true } },
                    solicitante: { select: { id: true, names: true, last_name: true, email: true } },
                    area_solicitante: { select: { id: true, name: true } }
                }
            }),
            this.prisma.salidas.update({
                where: { id: solicitud.salida_id },
                data: {
                    areas_participantes: {
                        connect: { id: solicitud.area_solicitante_id }
                    }
                }
            }),
        ]);

        await this.notifications.createForUser(solicitud.solicitante_id, 'union_aceptada',
            '✅ Solicitud de Unión Aceptada',
            `Tu solicitud para unirte a la programación ${solicitud.salida.codigo} fue aceptada.${dto.respuesta ? ' Respuesta: ' + dto.respuesta : ''}`,
            '/gestionar-salida');
        return updated;
    }

    async reject(id: string, dto: ResolveSolicitudUnionDto, user: users) {
        const solicitud = await this.prisma.solicitudes_union.findUnique({
            where: { id },
            include: { salida: { include: { areas: true } } }
        });
        if (!solicitud) throw new NotFoundException('Solicitud no encontrada');
        if (solicitud.estado !== 'pendiente') throw new BadRequestException('La solicitud ya fue procesada');

        const userType = await this.prisma.user_types.findUnique({ where: { id: user.user_type_id } });
        if (!['admin_subdireccion', 'superadmin'].includes(userType?.name || ''))
            throw new ForbiddenException('No autorizado');

        if (userType?.name === 'admin_subdireccion') {
            const subdireccionId = await this.getUserSubdireccionId(user);
            if (solicitud.salida.areas.subdireccion_id !== subdireccionId)
                throw new ForbiddenException('Esta solicitud no pertenece a tu subdirección');
        }

        const rejected = await this.prisma.solicitudes_union.update({
            where: { id },
            data: { estado: 'rechazada', respuesta: dto.respuesta },
            include: {
                salida: { select: { id: true, codigo: true, tema: true } },
                solicitante: { select: { id: true, names: true, last_name: true, email: true } },
                area_solicitante: { select: { id: true, name: true } }
            }
        });

        await this.notifications.createForUser(solicitud.solicitante_id, 'union_rechazada',
            '❌ Solicitud de Unión Rechazada',
            `Tu solicitud para unirte a la programación ${solicitud.salida.codigo} fue rechazada.${dto.respuesta ? ' Respuesta: ' + dto.respuesta : ''}`,
            '/gestionar-salida');
        return rejected;
    }
}

