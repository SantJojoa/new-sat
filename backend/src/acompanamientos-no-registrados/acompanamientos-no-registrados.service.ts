import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAcompanamientoNoRegistradoDto } from './dto/create-acompanamiento-no-registrado.dto';
import { UploadActaAcompanamientoNoRegistradoDto } from './dto/upload-acta-acompanamiento-no-registrado.dto';
import { users } from '@prisma/client';
import { AcompanamientoCertificateReport } from '../salidas/reports/acompanamiento-certificate.report';
import { parseDateLocal } from '../common/utils/date.util';
import { UserContextService } from '../common/services/user-context.service';

@Injectable()
export class AcompanamientosNoRegistradosService {
    constructor(
        private prisma: PrismaService,
        private acompanamientoCertificate: AcompanamientoCertificateReport,
        private userContext: UserContextService,
    ) { }

    // Excluye "archivo_manual" (Bytes) de las consultas de listado/detalle para no
    // transferir el PDF completo en cada carga; solo se expone el nombre del archivo.
    private readonly select = {
        id: true,
        codigo: true,
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
        area_id: true,
        registrador_id: true,
        areas: { select: { id: true, name: true, subdirecciones: { select: { id: true, name: true } } } },
        registrador: { select: { id: true, names: true, email: true } },
        created_at: true,
        updated_at: true,
    };

    private async resolveArea(areaId: string | undefined | null, registradorId: string | undefined | null, user: users) {
        const targetAreaId = await this.userContext.resolveTargetAreaId(areaId, registradorId, user);
        if (!targetAreaId) throw new BadRequestException('No se ha especificado o no tiene un área asignada');

        const area = await this.prisma.areas.findUnique({ where: { id: targetAreaId }, select: { name: true } });
        if (!area) throw new BadRequestException('El área especificada no es válida');

        return { targetAreaId, areaName: area.name };
    }

    private async generateCodigo(areaName: string) {
        const now = new Date();
        const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
        const prefix = `ANR-${dateStr}-${areaName.substring(0, 3).toUpperCase()}`;
        const count = await this.prisma.acompanamientos_no_registrados.count({ where: { codigo: { startsWith: prefix } } });
        const codigo = `${prefix}${String(count + 1).padStart(2, '0')}`;

        if (await this.prisma.acompanamientos_no_registrados.findUnique({ where: { codigo } }))
            throw new ConflictException('Error generando código único, intente nuevamente');

        return codigo;
    }

    async create(dto: CreateAcompanamientoNoRegistradoDto, user: users) {
        const { targetAreaId, areaName } = await this.resolveArea(dto.area_id, dto.registrador_id, user);
        const codigo = await this.generateCodigo(areaName);

        return this.prisma.acompanamientos_no_registrados.create({
            data: {
                codigo,
                nombre_reunion: dto.nombre_reunion,
                fecha_reunion: parseDateLocal(dto.fecha_reunion),
                hora_inicial: dto.hora_inicial,
                hora_final: dto.hora_final,
                acta_numero: dto.acta_numero ?? null,
                institucion: dto.institucion,
                municipio: dto.municipio,
                lugar: dto.lugar,
                material_entregado: dto.material_entregado ?? null,
                asistentes: dto.asistentes as any,
                orden_del_dia: dto.orden_del_dia as any,
                desarrollo: dto.desarrollo ?? null,
                conclusiones: dto.conclusiones ?? null,
                compromisos: dto.compromisos as any,
                proxima_lugar: dto.proxima_lugar ?? null,
                proxima_fecha: dto.proxima_fecha ? parseDateLocal(dto.proxima_fecha) : null,
                proxima_hora: dto.proxima_hora ?? null,
                area_id: targetAreaId,
                registrador_id: dto.registrador_id || user.id,
            },
            select: this.select,
        });
    }

    async uploadArchivo(dto: UploadActaAcompanamientoNoRegistradoDto, file: Express.Multer.File, user: users) {
        if (!file) throw new BadRequestException('No se recibió ningún archivo');

        const { targetAreaId, areaName } = await this.resolveArea(dto.area_id, dto.registrador_id, user);
        const codigo = await this.generateCodigo(areaName);
        const archivo = new Uint8Array(file.buffer);

        return this.prisma.acompanamientos_no_registrados.create({
            data: {
                codigo,
                nombre_reunion: dto.nombre_reunion,
                fecha_reunion: parseDateLocal(dto.fecha_reunion),
                institucion: dto.institucion,
                municipio: dto.municipio,
                lugar: dto.lugar,
                archivo_manual: archivo,
                archivo_manual_nombre: file.originalname,
                area_id: targetAreaId,
                registrador_id: dto.registrador_id || user.id,
            },
            select: this.select,
        });
    }

    async findAll(user: users, viewAll: boolean = false) {
        const userType = await this.userContext.getUserType(user);
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

        return this.prisma.acompanamientos_no_registrados.findMany({
            where,
            select: this.select,
            orderBy: { fecha_reunion: 'desc' },
        });
    }

    async findOne(id: string, user: users) {
        const registro = await this.prisma.acompanamientos_no_registrados.findUnique({
            where: { id },
            select: this.select,
        });
        if (!registro) throw new NotFoundException(`Registro ${id} no encontrado`);

        const userType = await this.userContext.getUserType(user);
        if (userType?.name === 'admin_subdireccion') {
            const subdireccionId = await this.userContext.getUserSubdireccionId(user);
            const areaInfo = await this.prisma.areas.findUnique({ where: { id: registro.area_id }, select: { subdireccion_id: true } });
            if (subdireccionId !== areaInfo?.subdireccion_id) throw new ForbiddenException('No tienes permiso');
        } else if (userType?.name !== 'superadmin' && registro.registrador_id !== user.id) {
            throw new ForbiddenException('No tienes permiso');
        }

        return registro;
    }

    async generateCertificado(id: string, user: users): Promise<Buffer> {
        const registro = await this.findOne(id, user);
        if (registro.archivo_manual_nombre) {
            throw new BadRequestException('Este registro tiene un acta escaneada subida, no un acta diligenciada por formulario');
        }
        return this.acompanamientoCertificate.generate({ seguimiento_acompanamiento: registro });
    }

    async getArchivo(id: string, user: users): Promise<{ buffer: Buffer; nombre: string }> {
        await this.findOne(id, user);
        const registro = await this.prisma.acompanamientos_no_registrados.findUnique({
            where: { id },
            select: { archivo_manual: true, archivo_manual_nombre: true },
        });
        if (!registro?.archivo_manual) throw new NotFoundException('No hay un acta escaneada cargada para este registro');
        return { buffer: Buffer.from(registro.archivo_manual), nombre: registro.archivo_manual_nombre || `acta-${id}.pdf` };
    }
}
