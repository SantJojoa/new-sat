import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAsesoriaDto } from './dto/create-asesoria.dto';
import { UpdateAsesoriaDto } from './dto/update-asesoria.dto';
import { users } from '@prisma/client';
import { AsesoriasCertificateReport } from './reports/asesorias-certificate.report';
import { parseDateLocal } from '../common/utils/date.util';
import { UserContextService } from '../common/services/user-context.service';

@Injectable()
export class AsesoriasService {
    constructor(
        private prisma: PrismaService,
        private certificateReport: AsesoriasCertificateReport,
        private userContext: UserContextService,
    ) { }

    private async getUserType(user: users) {
        return this.userContext.getUserType(user);
    }

    private calcularDuracionMinutos(horaInicio: string, horaFin: string): number {
        const toMinutes = (t: string) => {
            const [h, m] = t.split(':').map(Number);
            return h * 60 + m;
        };
        let diff = toMinutes(horaFin) - toMinutes(horaInicio);
        if (diff < 0) diff += 24 * 60;
        return diff;
    }

    async create(dto: CreateAsesoriaDto, user: users) {
        const targetAreaId = dto.area_id || user.area_id;
        if (!targetAreaId) throw new BadRequestException('No se ha especificado o no tiene un área asignada');

        const userArea = await this.prisma.areas.findUnique({ where: { id: targetAreaId }, select: { name: true } });
        if (!userArea) throw new BadRequestException('El área especificada no es válida');

        const now = new Date();
        const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
        const prefix = `ASE-${dateStr}-${userArea.name.substring(0, 3).toUpperCase()}`;
        const count = await this.prisma.asesorias.count({ where: { codigo: { startsWith: prefix } } });
        const codigo = `${prefix}${String(count + 1).padStart(2, '0')}`;

        if (await this.prisma.asesorias.findUnique({ where: { codigo } }))
            throw new ConflictException('Error generando código único, intente nuevamente');

        return this.prisma.asesorias.create({
            data: {
                codigo,
                fecha: parseDateLocal(dto.fecha),
                hora: dto.hora,
                hora_fin: dto.hora_fin,
                medio: dto.medio,
                institucion: dto.institucion,
                municipio_procedencia_id: dto.municipio_procedencia_id || null,
                municipio_otro: dto.municipio_otro || null,
                temas_tratados: dto.temas_tratados,
                material_entregado: dto.material_entregado,
                duracion_minutos: this.calcularDuracionMinutos(dto.hora, dto.hora_fin),
                estado: 'registrada',
                registrador_id: dto.solicitante_id || user.id,
                area_id: targetAreaId,
                asistentes: {
                    create: dto.asistentes?.map(a => ({
                        identificacion: a.identificacion,
                        nombre: a.nombre,
                        apellido: a.apellido,
                        cargo: a.cargo,
                        email: a.email,
                        movil: a.movil,
                    })) || [],
                },
            },
            include: {
                registrador: { select: { id: true, names: true, email: true } },
                areas: { select: { id: true, name: true } },
                municipio_procedencia: true,
                asistentes: true,
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
                where = { registrador_id: user.id };
            }
        }

        return this.prisma.asesorias.findMany({
            where,
            include: {
                registrador: { select: { id: true, names: true, email: true } },
                areas: { select: { id: true, name: true, subdirecciones: { select: { id: true, name: true } } } },
                municipio_procedencia: true,
                asistentes: true,
            },
            orderBy: { fecha: 'desc' },
        });
    }

    async findOne(id: string, user: users) {
        const asesoria = await this.prisma.asesorias.findUnique({
            where: { id },
            include: {
                registrador: { select: { id: true, names: true, last_name: true, email: true, charge: true, areas: { select: { name: true } } } },
                areas: { select: { id: true, name: true } },
                municipio_procedencia: true,
                asistentes: true,
            },
        });

        if (!asesoria) throw new NotFoundException(`Asesoría ${id} no encontrada`);

        const userType = await this.getUserType(user);

        if (userType?.name === 'admin_subdireccion') {
            const subdireccionId = await this.userContext.getUserSubdireccionId(user);
            const areaInfo = await this.prisma.areas.findUnique({ where: { id: asesoria.area_id }, select: { subdireccion_id: true } });
            if (subdireccionId !== areaInfo?.subdireccion_id) throw new ForbiddenException('No tienes permiso');
        } else if (userType?.name !== 'superadmin' && asesoria.registrador_id !== user.id) {
            throw new ForbiddenException('No tienes permiso');
        }

        return asesoria;
    }

    async update(id: string, dto: UpdateAsesoriaDto, user: users) {
        const existing = await this.findOne(id, user);

        if (dto.asistentes !== undefined) {
            await this.prisma.asesoria_asistentes.deleteMany({ where: { asesoria_id: id } });
        }

        const horaInicio = dto.hora ?? existing.hora;
        const horaFin = dto.hora_fin ?? existing.hora_fin;

        return this.prisma.asesorias.update({
            where: { id },
            data: {
                fecha: dto.fecha ? parseDateLocal(dto.fecha) : undefined,
                hora: dto.hora,
                hora_fin: dto.hora_fin,
                medio: dto.medio,
                institucion: dto.institucion,
                municipio_procedencia_id: dto.municipio_procedencia_id,
                municipio_otro: dto.municipio_otro,
                temas_tratados: dto.temas_tratados,
                material_entregado: dto.material_entregado,
                duracion_minutos: (dto.hora || dto.hora_fin) ? this.calcularDuracionMinutos(horaInicio, horaFin) : undefined,
                asistentes: dto.asistentes ? {
                    create: dto.asistentes.map(a => ({
                        identificacion: a.identificacion,
                        nombre: a.nombre,
                        apellido: a.apellido,
                        cargo: a.cargo,
                        email: a.email,
                        movil: a.movil,
                    })),
                } : undefined,
            },
            include: {
                registrador: { select: { id: true, names: true, email: true } },
                areas: { select: { id: true, name: true } },
                municipio_procedencia: true,
                asistentes: true,
            },
        });
    }

    async remove(id: string, user: users) {
        await this.findOne(id, user);
        return this.prisma.asesorias.delete({ where: { id } });
    }

    async generateCertificado(id: string, user: users): Promise<Buffer> {
        const asesoria = await this.findOne(id, user);
        return this.certificateReport.generate(asesoria);
    }

    async getCatalogos(user: users) {
        const [municipios, areas, lideres] = await Promise.all([
            this.prisma.municipios.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
            this.prisma.areas.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
            this.prisma.users.findMany({
                where: user.area_id ? { area_id: user.area_id } : {},
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
