import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAsesoriaDto } from './dto/create-asesoria.dto';
import { UpdateAsesoriaDto } from './dto/update-asesoria.dto';
import { users } from '@prisma/client';
import { AsesoriasCertificateReport } from './reports/asesorias-certificate.report';

@Injectable()
export class AsesoriasService {
    constructor(
        private prisma: PrismaService,
        private certificateReport: AsesoriasCertificateReport,
    ) { }

    private parseDateLocal(dateStr: string | Date): Date {
        if (dateStr instanceof Date) return dateStr;
        if (dateStr.includes('T')) return new Date(dateStr);
        return new Date(`${dateStr}T12:00:00`);
    }

    private async getUserType(user: users) {
        return this.prisma.user_types.findUnique({ where: { id: user.user_type_id } });
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

        return this.prisma.asesorias.create({
            data: {
                codigo,
                fecha: this.parseDateLocal(dto.fecha),
                hora: dto.hora,
                medio: dto.medio,
                institucion: dto.institucion,
                municipio_procedencia_id: dto.municipio_procedencia_id || null,
                municipio_otro: dto.municipio_otro || null,
                lugar: dto.lugar,
                temas_tratados: dto.temas_tratados,
                material_entregado: dto.material_entregado,
                duracion_minutos: dto.duracion_minutos,
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
                compromisos: {
                    create: dto.compromisos?.map(c => ({
                        compromiso: c.compromiso,
                        responsable: c.responsable,
                        fecha: c.fecha ? this.parseDateLocal(c.fecha) : null,
                        observaciones: c.observaciones,
                    })) || [],
                },
            },
            include: {
                registrador: { select: { id: true, names: true, email: true } },
                areas: { select: { id: true, name: true } },
                municipio_procedencia: true,
                asistentes: true,
                compromisos: true,
            },
        });
    }

    async findAll(user: users, viewAll: boolean = false) {
        const userType = await this.getUserType(user);
        if (!userType) throw new ForbiddenException('Tipo no encontrado');

        let where: any = {};

        if (!viewAll) {
            if (userType.name === 'admin_subdireccion') {
                const subdireccionId = user.subdireccion_id || (user.area_id
                    ? (await this.prisma.areas.findUnique({ where: { id: user.area_id }, select: { subdireccion_id: true } }))?.subdireccion_id
                    : null);
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
                areas: { select: { id: true, name: true } },
                municipio_procedencia: true,
                asistentes: true,
                compromisos: true,
            },
            orderBy: { fecha: 'desc' },
        });
    }

    async findOne(id: string, user: users) {
        const asesoria = await this.prisma.asesorias.findUnique({
            where: { id },
            include: {
                registrador: { select: { id: true, names: true, email: true, charge: true, areas: { select: { name: true } } } },
                areas: { select: { id: true, name: true } },
                municipio_procedencia: true,
                asistentes: true,
                compromisos: true,
            },
        });

        if (!asesoria) throw new NotFoundException(`Asesoría ${id} no encontrada`);

        const userType = await this.getUserType(user);

        if (userType?.name === 'admin_subdireccion') {
            const subdireccionId = user.subdireccion_id || (user.area_id
                ? (await this.prisma.areas.findUnique({ where: { id: user.area_id }, select: { subdireccion_id: true } }))?.subdireccion_id
                : null);
            const areaInfo = await this.prisma.areas.findUnique({ where: { id: asesoria.area_id }, select: { subdireccion_id: true } });
            if (subdireccionId !== areaInfo?.subdireccion_id) throw new ForbiddenException('No tienes permiso');
        } else if (userType?.name !== 'superadmin' && asesoria.registrador_id !== user.id) {
            throw new ForbiddenException('No tienes permiso');
        }

        return asesoria;
    }

    async update(id: string, dto: UpdateAsesoriaDto, user: users) {
        await this.findOne(id, user);

        await this.prisma.asesoria_asistentes.deleteMany({ where: { asesoria_id: id } });
        await this.prisma.asesoria_compromisos.deleteMany({ where: { asesoria_id: id } });

        return this.prisma.asesorias.update({
            where: { id },
            data: {
                fecha: dto.fecha ? this.parseDateLocal(dto.fecha) : undefined,
                hora: dto.hora,
                medio: dto.medio,
                institucion: dto.institucion,
                municipio_procedencia_id: dto.municipio_procedencia_id,
                municipio_otro: dto.municipio_otro,
                lugar: dto.lugar,
                temas_tratados: dto.temas_tratados,
                material_entregado: dto.material_entregado,
                duracion_minutos: dto.duracion_minutos,
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
                compromisos: dto.compromisos ? {
                    create: dto.compromisos.map(c => ({
                        compromiso: c.compromiso,
                        responsable: c.responsable,
                        fecha: c.fecha ? this.parseDateLocal(c.fecha) : null,
                        observaciones: c.observaciones,
                    })),
                } : undefined,
            },
            include: {
                registrador: { select: { id: true, names: true, email: true } },
                areas: { select: { id: true, name: true } },
                municipio_procedencia: true,
                asistentes: true,
                compromisos: true,
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

    async previewCertificado(id: string, user: users): Promise<string> {
        const asesoria = await this.findOne(id, user);
        return this.certificateReport.getHtml(asesoria);
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
