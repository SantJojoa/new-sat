import { Injectable, ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SalidasService } from '../salidas/salidas.service';
import { UserContextService } from '../common/services/user-context.service';
import { CreateUnidadAnalisisDto } from './dto/create-unidad-analisis.dto';
import { UpdateUnidadAnalisisDto } from './dto/update-unidad-analisis.dto';
import { users } from '@prisma/client';
import { parseDateLocal } from '../common/utils/date.util';

const SUBTIPO_FIJO = 'Inspección y Vigilancia SP (IV)';

@Injectable()
export class UnidadAnalisisService {
    constructor(
        private prisma: PrismaService,
        private salidasService: SalidasService,
        private userContext: UserContextService,
    ) { }

    private readonly include = {
        municipios: true, salida_ips: { include: { ips: true, actor: true } }, entidades: true,
        salida_eapb: { include: { eapb: true, actor: true } },
        organizaciones: true, idsn: true,
        lugar_evento: { select: { id: true, name: true } },
        solicitante: { select: { id: true, names: true, email: true } },
        areas: { select: { id: true, name: true, subdireccion_id: true, subdirecciones: { select: { id: true, name: true } } } },
        seguimiento_articulacion_iv: {
            select: {
                id: true, salida_id: true, se_realizo_vsp: true, observaciones: true,
                archivo_manual_nombre: true, created_at: true, updated_at: true,
            },
        },
    };

    async create(dto: CreateUnidadAnalisisDto, user: users) {
        const targetAreaId = await this.userContext.resolveTargetAreaId(dto.area_id, dto.solicitante_id, user);
        if (!targetAreaId) throw new BadRequestException('No se ha especificado o no tiene un área asignada');

        const userArea = await this.prisma.areas.findUnique({ where: { id: targetAreaId }, select: { name: true } });
        if (!userArea) throw new BadRequestException('El área especificada no es válida');

        const now = new Date();
        const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
        const pattern = `UA-${dateStr}-${userArea.name.substring(0, 3).toUpperCase()}`;
        const count = await this.prisma.salidas.count({ where: { codigo: { startsWith: pattern } } });
        const newCodigo = `${pattern}${String(count + 1).padStart(2, '0')}`;

        let municipiosConvocadosStr: string | undefined;
        if (dto.municipios_ids?.length) {
            const munis = await this.prisma.municipios.findMany({ where: { id: { in: dto.municipios_ids } }, select: { name: true } });
            municipiosConvocadosStr = munis.map(m => m.name).join(', ');
        }

        return this.prisma.salidas.create({
            data: {
                codigo: newCodigo,
                tipo_salida: dto.tipo_salida,
                subtipo_salida: SUBTIPO_FIJO,
                tema: dto.tema, descripcion: dto.descripcion,
                fecha_inicio: parseDateLocal(dto.fecha_inicio),
                fecha_final: parseDateLocal(dto.fecha_final),
                jornada: dto.jornada,
                estado: 'registrada',
                es_unidad_analisis: true,
                solicitante_id: dto.solicitante_id || user.id,
                area_id: targetAreaId,
                transporte_medio: dto.transporte_medio,
                transporte_responsables: dto.transporte_responsables,
                instituciones_convocadas: dto.instituciones_convocadas,
                municipios_convocados: municipiosConvocadosStr,
                lugar_evento_id: dto.lugar_evento_id,
                municipios: { connect: dto.municipios_ids?.map(id => ({ id })) || [] },
                salida_ips: { create: dto.ips_actores?.map(item => ({ ips_id: item.ips_id, actor_id: item.actor_id || null })) || [] },
                entidades: { connect: dto.entidades_ids?.map(id => ({ id })) || [] },
                salida_eapb: { create: dto.eapb_actores?.map(item => ({ eapb_id: item.eapb_id, actor_id: item.actor_id || null })) || [] },
                organizaciones: { connect: dto.organizaciones_ids?.map(id => ({ id })) || [] },
                idsn: { connect: dto.idsn_ids?.map(id => ({ id })) || [] },
            },
            include: this.include,
        });
    }

    async findAll(user: users, viewAll: boolean = false) {
        const userType = await this.prisma.user_types.findUnique({ where: { id: user.user_type_id } });
        if (!userType) throw new ForbiddenException('Tipo no encontrado');

        const where: any = { es_unidad_analisis: true };
        if (!viewAll) {
            if (userType.name === 'admin_subdireccion') {
                const subdireccionId = await this.userContext.getUserSubdireccionId(user);
                if (!subdireccionId) throw new ForbiddenException('Área no encontrada');
                where.areas = { subdireccion_id: subdireccionId };
            } else if (userType.name !== 'superadmin') {
                where.solicitante_id = user.id;
            }
        }

        return this.prisma.salidas.findMany({ where, include: this.include, orderBy: { fecha_inicio: 'desc' } });
    }

    async findOne(id: string, user: users) {
        const record = await this.salidasService.findOne(id, user);
        if (!record.es_unidad_analisis) throw new NotFoundException(`Unidad de Análisis ${id} no encontrada`);
        return record;
    }

    async update(id: string, dto: UpdateUnidadAnalisisDto, user: users) {
        // findOne ya valida propiedad/subdirección (propietario, admin_subdireccion de la
        // misma subdirección, o superadmin) — no hay más roles que puedan llegar hasta aquí.
        await this.findOne(id, user);

        let municipiosConvocadosStr: string | undefined;
        if (dto.municipios_ids?.length) {
            const munis = await this.prisma.municipios.findMany({ where: { id: { in: dto.municipios_ids } }, select: { name: true } });
            municipiosConvocadosStr = munis.map(m => m.name).join(', ');
        }

        return this.prisma.salidas.update({
            where: { id },
            data: {
                tipo_salida: dto.tipo_salida,
                tema: dto.tema, descripcion: dto.descripcion,
                fecha_inicio: dto.fecha_inicio ? parseDateLocal(dto.fecha_inicio) : undefined,
                fecha_final: dto.fecha_final ? parseDateLocal(dto.fecha_final) : undefined,
                jornada: dto.jornada, transporte_medio: dto.transporte_medio,
                transporte_responsables: dto.transporte_responsables,
                instituciones_convocadas: dto.instituciones_convocadas,
                municipios_convocados: municipiosConvocadosStr, lugar_evento_id: dto.lugar_evento_id,
                municipios: dto.municipios_ids ? { set: dto.municipios_ids.map(id => ({ id })) } : undefined,
                salida_ips: dto.ips_actores !== undefined ? {
                    deleteMany: {},
                    create: dto.ips_actores.map(item => ({ ips_id: item.ips_id, actor_id: item.actor_id || null }))
                } : undefined,
                entidades: dto.entidades_ids ? { set: dto.entidades_ids.map(id => ({ id })) } : undefined,
                salida_eapb: dto.eapb_actores !== undefined ? {
                    deleteMany: {},
                    create: dto.eapb_actores.map(item => ({ eapb_id: item.eapb_id, actor_id: item.actor_id || null }))
                } : undefined,
                organizaciones: dto.organizaciones_ids ? { set: dto.organizaciones_ids.map(id => ({ id })) } : undefined,
                idsn: dto.idsn_ids ? { set: dto.idsn_ids.map(id => ({ id })) } : undefined,
            },
            include: this.include,
        });
    }

    async remove(id: string, user: users) {
        await this.findOne(id, user);
        return this.prisma.salidas.delete({ where: { id } });
    }

    async getCatalogos(user: users) {
        return this.salidasService.getCatalogos(user);
    }
}
