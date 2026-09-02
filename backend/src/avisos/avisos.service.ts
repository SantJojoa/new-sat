import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAvisoDto } from './dto/create-aviso.dto';
import { UpdateAvisoDto } from './dto/update-aviso.dto';
import { users } from '@prisma/client';

@Injectable()
export class AvisosService {
    constructor(private prisma: PrismaService) { }

    private ensureSuperadmin(user: any) {
        if (user?.user_types?.name !== 'superadmin') {
            throw new ForbiddenException('Solo el superadmin puede gestionar los avisos');
        }
    }

    async create(dto: CreateAvisoDto, user: users) {
        this.ensureSuperadmin(user);
        return this.prisma.avisos.create({
            data: {
                titulo: dto.titulo,
                mensaje: dto.mensaje,
                created_by_id: user.id,
            },
        });
    }

    async findAll(user: users) {
        this.ensureSuperadmin(user);
        return this.prisma.avisos.findMany({
            orderBy: { created_at: 'desc' },
            include: { created_by: { select: { id: true, names: true, last_name: true } } },
        });
    }

    async findActive() {
        return this.prisma.avisos.findMany({
            where: { is_active: true },
            orderBy: { created_at: 'desc' },
            select: { id: true, titulo: true, mensaje: true, created_at: true },
        });
    }

    async update(id: string, dto: UpdateAvisoDto, user: users) {
        this.ensureSuperadmin(user);
        const aviso = await this.prisma.avisos.findUnique({ where: { id } });
        if (!aviso) throw new NotFoundException('Aviso no encontrado');

        return this.prisma.avisos.update({
            where: { id },
            data: {
                titulo: dto.titulo,
                mensaje: dto.mensaje,
                is_active: dto.is_active,
            },
        });
    }

    async remove(id: string, user: users) {
        this.ensureSuperadmin(user);
        const aviso = await this.prisma.avisos.findUnique({ where: { id } });
        if (!aviso) throw new NotFoundException('Aviso no encontrado');

        await this.prisma.avisos.delete({ where: { id } });
        return { success: true };
    }
}
