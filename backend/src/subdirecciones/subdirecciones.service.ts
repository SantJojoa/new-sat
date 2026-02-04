import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateSubdireccionDto } from "./dto/create-subdireccion.dto";
import { UpdateSubdireccionDto } from "./dto/update-subdireccion.dto";

@Injectable()
export class SubdireccionesService {
    constructor(private prisma: PrismaService) { }

    async create(createSubdireccionDto: CreateSubdireccionDto) {
        const existingSubdireccion = await this.prisma.subdirecciones.findUnique({
            where: {
                name: createSubdireccionDto.name
            }
        });

        if (existingSubdireccion) {
            throw new ConflictException('Subdireccion with this name already exists');
        }

        return await this.prisma.subdirecciones.create({
            data: createSubdireccionDto,
        });
    }

    async findAll() {
        return await this.prisma.subdirecciones.findMany();
    }

    async findOne(id: string) {
        const subdireccion = await this.prisma.subdirecciones.findUnique({
            where: { id },
            include: {
                areas: true
            }
        });

        if (!subdireccion) {
            throw new NotFoundException('Subdireccion not found');
        }

        return subdireccion;
    }

    async update(id: string, updateSubdireccionDto: UpdateSubdireccionDto) {
        await this.findOne(id);

        return await this.prisma.subdirecciones.update({
            where: { id },
            data: updateSubdireccionDto,
        });
    }

    async remove(id: string) {
        await this.findOne(id);

        return await this.prisma.subdirecciones.delete({
            where: { id },
        });
    }
}
