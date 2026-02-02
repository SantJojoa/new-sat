import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSalidaDto } from './dto/create-salida.dto';
import { UpdateSalidaDto } from './dto/update-salida.dto';
import { ApproveSalidaDto, RejectSalidaDto } from './dto/aprove-salida.dto';
import { users } from '@prisma/client';

@Injectable()
export class SalidasService {
    constructor(private prisma: PrismaService) { }

    async create(createSalidaDto: CreateSalidaDto, user: users) {
        // Verificar que el usuario tenga un área asignada
        if (!user.area_id) {
            throw new BadRequestException('El usuario no tiene un área asignada');
        }

        // Verificar que el código no exista
        const existingCodigo = await this.prisma.salidas.findUnique({
            where: { codigo: createSalidaDto.codigo },
        });

        if (existingCodigo) {
            throw new BadRequestException('El código de salida ya existe');
        }

        // Crear la salida
        return this.prisma.salidas.create({
            data: {
                ...createSalidaDto,
                solicitante_id: user.id,
                area_id: user.area_id,
                estado: 'pendiente',
            },
            include: {
                solicitante: {
                    select: {
                        id: true,
                        names: true,
                        last_name: true,
                        email: true,
                    },
                },
                areas: {
                    select: {
                        id: true,
                        name: true,
                        subdireccion_id: true,
                    },
                },
            },
        });
    }

    async findAll(user: users) {
        const userType = await this.prisma.user_types.findUnique({
            where: { id: user.user_type_id },
        });

        if (!userType) {
            throw new ForbiddenException('Tipo de usuario no encontrado');
        }

        // Si es superadmin, ver todas las salidas
        if (userType.name === 'superadmin') {
            return this.prisma.salidas.findMany({
                include: {
                    solicitante: {
                        select: {
                            id: true,
                            names: true,
                            last_name: true,
                            email: true,
                        },
                    },
                    aprobador: {
                        select: {
                            id: true,
                            names: true,
                            last_name: true,
                            email: true,
                        },
                    },
                    areas: {
                        select: {
                            id: true,
                            name: true,
                            subdirecciones: {
                                select: {
                                    id: true,
                                    name: true,
                                },
                            },
                        },
                    },
                },
                orderBy: {
                    fecha_solicitud: 'desc',
                },
            });
        }

        // Si es admin_subdireccion, ver salidas de su subdirección
        if (userType.name === 'admin_subdireccion') {
            const userArea = await this.prisma.areas.findUnique({
                where: { id: user.area_id! },
                include: { subdirecciones: true },
            });

            if (!userArea) {
                throw new ForbiddenException('Área del usuario no encontrada');
            }

            return this.prisma.salidas.findMany({
                where: {
                    areas: {
                        subdireccion_id: userArea.subdireccion_id,
                    },
                },
                include: {
                    solicitante: {
                        select: {
                            id: true,
                            names: true,
                            last_name: true,
                            email: true,
                        },
                    },
                    aprobador: {
                        select: {
                            id: true,
                            names: true,
                            last_name: true,
                            email: true,
                        },
                    },
                    areas: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
                orderBy: {
                    fecha_solicitud: 'desc',
                },
            });
        }

        // Para líderes y usuarios normales, ver solo sus salidas
        return this.prisma.salidas.findMany({
            where: {
                solicitante_id: user.id,
            },
            include: {
                solicitante: {
                    select: {
                        id: true,
                        names: true,
                        last_name: true,
                        email: true,
                    },
                },
                aprobador: {
                    select: {
                        id: true,
                        names: true,
                        last_name: true,
                        email: true,
                    },
                },
                areas: {
                    select: {
                        id: true,
                        name: true,
                        subdireccion_id: true,
                    },
                },
            },
            orderBy: {
                fecha_solicitud: 'desc',
            },
        });
    }

    async findOne(id: string, user: users) {
        const salida = await this.prisma.salidas.findUnique({
            where: { id },
            include: {
                solicitante: {
                    select: {
                        id: true,
                        names: true,
                        last_name: true,
                        email: true,
                        charge: true,
                    },
                },
                aprobador: {
                    select: {
                        id: true,
                        names: true,
                        last_name: true,
                        email: true,
                    },
                },
                areas: {
                    select: {
                        id: true,
                        name: true,
                        subdireccion_id: true,
                        subdirecciones: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        });

        if (!salida) {
            throw new NotFoundException(`Salida con ID ${id} no encontrada`);
        }

        // Verificar permisos de vista
        const userType = await this.prisma.user_types.findUnique({
            where: { id: user.user_type_id },
        });

        if (!userType) {
            throw new ForbiddenException('Tipo de usuario no encontrado');
        }

        // Superadmin puede ver todo
        if (userType.name === 'superadmin') {
            return salida;
        }

        // Admin subdirección puede ver solo de su subdirección
        if (userType.name === 'admin_subdireccion') {
            const userArea = await this.prisma.areas.findUnique({
                where: { id: user.area_id! },
                include: { subdirecciones: true },
            });

            if (!userArea) {
                throw new ForbiddenException('Área del usuario no encontrada');
            }

            if (salida.areas.subdireccion_id !== userArea.subdireccion_id) {
                throw new ForbiddenException('No tienes permiso para ver esta salida');
            }
            return salida;
        }

        // Líder y usuario solo pueden ver sus propias salidas
        if (salida.solicitante_id !== user.id) {
            throw new ForbiddenException('Solo puedes ver tus propias salidas');
        }

        return salida;
    }

    async update(id: string, updateSalidaDto: UpdateSalidaDto, user: users) {
        // Verificar que la salida existe
        const salida = await this.findOne(id, user);

        // Solo se pueden editar salidas en estado 'pendiente'
        if (salida.estado !== 'pendiente') {
            throw new BadRequestException('Solo se pueden editar salidas en estado pendiente');
        }

        // Solo el solicitante o superadmin pueden editar
        const userType = await this.prisma.user_types.findUnique({
            where: { id: user.user_type_id },
        });

        if (!userType) {
            throw new ForbiddenException('Tipo de usuario no encontrado');
        }

        if (salida.solicitante_id !== user.id && userType.name !== 'superadmin') {
            throw new ForbiddenException('Solo el solicitante puede editar esta salida');
        }

        // Si se intenta cambiar el código, verificar que no exista
        if (updateSalidaDto.codigo && updateSalidaDto.codigo !== salida.codigo) {
            const existingCodigo = await this.prisma.salidas.findUnique({
                where: { codigo: updateSalidaDto.codigo },
            });

            if (existingCodigo) {
                throw new BadRequestException('El código de salida ya existe');
            }
        }

        return this.prisma.salidas.update({
            where: { id },
            data: updateSalidaDto,
            include: {
                solicitante: {
                    select: {
                        id: true,
                        names: true,
                        last_name: true,
                        email: true,
                    },
                },
                areas: {
                    select: {
                        id: true,
                        name: true,
                        subdireccion_id: true,
                    },
                },
            },
        });
    }

    async remove(id: string, user: users) {
        // Verificar que la salida existe
        const salida = await this.findOne(id, user);

        // Solo se pueden eliminar salidas en estado 'pendiente'
        if (salida.estado !== 'pendiente') {
            throw new BadRequestException('Solo se pueden eliminar salidas en estado pendiente');
        }

        // Solo el solicitante o superadmin pueden eliminar
        const userType = await this.prisma.user_types.findUnique({
            where: { id: user.user_type_id },
        });

        if (!userType) {
            throw new ForbiddenException('Tipo de usuario no encontrado');
        }

        if (salida.solicitante_id !== user.id && userType.name !== 'superadmin') {
            throw new ForbiddenException('Solo el solicitante puede eliminar esta salida');
        }

        return this.prisma.salidas.delete({
            where: { id },
        });
    }

    async approve(id: string, user: users, approveDto: ApproveSalidaDto) {
        // Verificar que la salida existe
        const salida = await this.findOne(id, user);

        // Verificar que esté pendiente
        if (salida.estado !== 'pendiente') {
            throw new BadRequestException('Solo se pueden aprobar salidas en estado pendiente');
        }

        // Verificar permisos de aprobación
        const userType = await this.prisma.user_types.findUnique({
            where: { id: user.user_type_id },
        });

        if (!userType) {
            throw new ForbiddenException('Tipo de usuario no encontrado');
        }

        if (!['admin_subdireccion', 'superadmin'].includes(userType.name)) {
            throw new ForbiddenException('No tienes permiso para aprobar salidas');
        }

        // Verificar que el admin sea de la misma subdirección (si no es superadmin)
        if (userType.name === 'admin_subdireccion') {
            const userArea = await this.prisma.areas.findUnique({
                where: { id: user.area_id! },
                include: { subdirecciones: true },
            });

            if (!userArea) {
                throw new ForbiddenException('Área del usuario no encontrada');
            }

            if (salida.areas.subdireccion_id !== userArea.subdireccion_id) {
                throw new ForbiddenException('Solo puedes aprobar salidas de tu subdirección');
            }
        }

        // No se puede aprobar una salida propia
        if (salida.solicitante_id === user.id) {
            throw new BadRequestException('No puedes aprobar tus propias salidas');
        }

        return this.prisma.salidas.update({
            where: { id },
            data: {
                estado: 'aprobada',
                fecha_aprobacion: new Date(),
                aprobador_id: user.id,
                observaciones: approveDto.observaciones
                    ? `${salida.observaciones || ''}\n\nAPROBADO: ${approveDto.observaciones}`.trim()
                    : salida.observaciones,
            },
            include: {
                solicitante: {
                    select: {
                        id: true,
                        names: true,
                        last_name: true,
                        email: true,
                    },
                },
                aprobador: {
                    select: {
                        id: true,
                        names: true,
                        last_name: true,
                        email: true,
                    },
                },
                areas: {
                    select: {
                        id: true,
                        name: true,
                        subdireccion_id: true,
                    },
                },
            },
        });
    }

    async reject(id: string, user: users, rejectDto: RejectSalidaDto) {
        // Verificar que la salida existe
        const salida = await this.findOne(id, user);

        // Verificar que esté pendiente
        if (salida.estado !== 'pendiente') {
            throw new BadRequestException('Solo se pueden rechazar salidas en estado pendiente');
        }

        // Verificar permisos de rechazo (mismos que aprobación)
        const userType = await this.prisma.user_types.findUnique({
            where: { id: user.user_type_id },
        });

        if (!userType) {
            throw new ForbiddenException('Tipo de usuario no encontrado');
        }

        if (!['admin_subdireccion', 'superadmin'].includes(userType.name)) {
            throw new ForbiddenException('No tienes permiso para rechazar salidas');
        }

        // Verificar que el admin sea de la misma subdirección (si no es superadmin)
        if (userType.name === 'admin_subdireccion') {
            const userArea = await this.prisma.areas.findUnique({
                where: { id: user.area_id! },
                include: { subdirecciones: true },
            });

            if (!userArea) {
                throw new ForbiddenException('Área del usuario no encontrada');
            }

            if (salida.areas.subdireccion_id !== userArea.subdireccion_id) {
                throw new ForbiddenException('Solo puedes rechazar salidas de tu subdirección');
            }
        }

        // No se puede rechazar una salida propia
        if (salida.solicitante_id === user.id) {
            throw new BadRequestException('No puedes rechazar tus propias salidas');
        }

        return this.prisma.salidas.update({
            where: { id },
            data: {
                estado: 'rechazada',
                fecha_aprobacion: new Date(),
                aprobador_id: user.id,
                observaciones: `${salida.observaciones || ''}\n\nRECHAZADO: ${rejectDto.motivo}`.trim(),
            },
            include: {
                solicitante: {
                    select: {
                        id: true,
                        names: true,
                        last_name: true,
                        email: true,
                    },
                },
                aprobador: {
                    select: {
                        id: true,
                        names: true,
                        last_name: true,
                        email: true,
                    },
                },
                areas: {
                    select: {
                        id: true,
                        name: true,
                        subdireccion_id: true,
                    },
                },
            },
        });
    }

    async getEstadisticas(user: users) {
        const userType = await this.prisma.user_types.findUnique({
            where: { id: user.user_type_id },
        });

        if (!userType) {
            throw new ForbiddenException('Tipo de usuario no encontrado');
        }

        let whereClause = {};

        if (userType.name === 'admin_subdireccion') {
            const userArea = await this.prisma.areas.findUnique({
                where: { id: user.area_id! },
                include: { subdirecciones: true },
            });

            if (!userArea) {
                throw new ForbiddenException('Área del usuario no encontrada');
            }

            whereClause = {
                areas: {
                    subdireccion_id: userArea.subdireccion_id,
                },
            };
        } else if (!['superadmin'].includes(userType.name)) {
            whereClause = {
                solicitante_id: user.id,
            };
        }

        const [
            total,
            pendientes,
            aprobadas,
            rechazadas,
            porTipo,
            porMes,
        ] = await Promise.all([
            // Total
            this.prisma.salidas.count({ where: whereClause }),

            // Pendientes
            this.prisma.salidas.count({
                where: { ...whereClause, estado: 'pendiente' },
            }),

            // Aprobadas
            this.prisma.salidas.count({
                where: { ...whereClause, estado: 'aprobada' },
            }),

            // Rechazadas
            this.prisma.salidas.count({
                where: { ...whereClause, estado: 'rechazada' },
            }),

            // Por tipo
            this.prisma.salidas.groupBy({
                by: ['tipo_salida'],
                where: whereClause,
                _count: true,
            }),

            // Por mes (últimos 6 meses)
            this.prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('month', fecha_solicitud) as mes,
          COUNT(*) as cantidad,
          SUM(cantidad) as total_unidades
        FROM salidas
        WHERE fecha_solicitud >= NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', fecha_solicitud)
        ORDER BY mes DESC
      `,
        ]);

        return {
            total,
            pendientes,
            aprobadas,
            rechazadas,
            porTipo: porTipo.map(item => ({
                tipo: item.tipo_salida,
                cantidad: item._count,
            })),
            porMes,
        };
    }
}