import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateAreaDto } from "./dto/create-area.dto";
import { UpdateAreaDto } from "./dto/update-area.dto";

@Injectable()
export class AreasService {
    constructor(private prisma: PrismaService) { }

    async create(createAreaDto: CreateAreaDto) {
        const existingArea = await this.prisma.areas.findUnique({
            where: {
                name: createAreaDto.name
            }
        });

        if (existingArea) {
            throw new ConflictException('Area with this name already exists');
        }

        // Verify subdireccion exists, though FK constraint handles it, it's good to check
        const subdireccion = await this.prisma.subdirecciones.findUnique({
            where: { id: createAreaDto.subdireccion_id }
        });
        if (!subdireccion) {
            throw new NotFoundException('Subdireccion not found');
        }

        return await this.prisma.areas.create({
            data: createAreaDto,
        });
    }

    async findAll() {
        return await this.prisma.areas.findMany({
            include: {
                subdirecciones: true
            }
        });
    }

    async findOne(id: string) {
        const area = await this.prisma.areas.findUnique({
            where: { id },
            include: {
                subdirecciones: true
            }
        });

        if (!area) {
            throw new NotFoundException('Area not found');
        }

        return area;
    }

    async update(id: string, updateAreaDto: UpdateAreaDto) {
        await this.findOne(id);

        if (updateAreaDto.subdireccion_id) {
            const subdireccion = await this.prisma.subdirecciones.findUnique({
                where: { id: updateAreaDto.subdireccion_id }
            });
            if (!subdireccion) {
                throw new NotFoundException('Subdireccion not found');
            }
        }

        return await this.prisma.areas.update({
            where: { id },
            data: updateAreaDto,
        });
    }

    async remove(id: string) {
        await this.findOne(id);

        return await this.prisma.areas.delete({
            where: { id },
        });
    }
}
