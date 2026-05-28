import { Injectable, NotFoundException, ConflictException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    private readonly userInclude = {
        areas: {
            include: {
                subdirecciones: true
            }
        },
        subdirecciones: true,
        user_types: {
            include: {
                permissions: {
                    include: {
                        modules: true
                    }
                }
            }
        }
    };

    async create(createUserDto: CreateUserDto) {

        const existingUser = await this.prisma.users.findFirst({
            where: {
                OR: [
                    { username: createUserDto.username },
                    { email: createUserDto.email },
                    { num_id: createUserDto.num_id }
                ]
            }
        })

        if (existingUser) {
            throw new ConflictException('User already exists');
        }

        const normalizedSubdireccionId = createUserDto.subdireccion_id === '' ? undefined : createUserDto.subdireccion_id;
        const normalizedAreaId = createUserDto.area_id === '' ? undefined : createUserDto.area_id;

        const userType = await this.prisma.user_types.findUnique({
            where: { id: createUserDto.user_type_id }
        });

        if (!userType) {
            throw new BadRequestException('Tipo de usuario no encontrado');
        }

        if (userType.name === 'admin_subdireccion' && !normalizedSubdireccionId) {
            throw new BadRequestException('Debe seleccionar una subdirección');
        }

        const area = normalizedAreaId
            ? await this.prisma.areas.findUnique({
                where: { id: normalizedAreaId },
                select: { subdireccion_id: true }
            })
            : null;

        if (normalizedAreaId && !area) {
            throw new BadRequestException('Área no encontrada');
        }

        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

        const user = await this.prisma.users.create({
            data: {
                ...createUserDto,
                password: hashedPassword,
                area_id: normalizedAreaId,
                subdireccion_id: userType.name === 'admin_subdireccion'
                    ? normalizedSubdireccionId
                    : (area?.subdireccion_id ?? null),
            },
        });

        const { password, ...result } = user;

        return result;
    }

    async findUserTypes() {
        return await this.prisma.user_types.findMany();
    }

    async findAll() {
        const users = await this.prisma.users.findMany({
            include: this.userInclude,
        });

        return users.map(user => {
            const { password, ...result } = user;
            return result;
        });
    }

    async findOne(id: string) {
        const user = await this.prisma.users.findUnique({
            where: {
                id
            },
            include: this.userInclude,
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const { password, ...result } = user;

        return result;
    }

    async findByUsername(username: string) {
        return await this.prisma.users.findUnique({
            where: {
                username
            },
            include: this.userInclude,
        });
    }

    async findByEmail(email: string) {
        return await this.prisma.users.findUnique({
            where: {
                email
            },
            include: this.userInclude,
        });
    }


    async update(id: string, updateUserDto: UpdateUserDto) {

        const existing = await this.findOne(id);

        if (updateUserDto.password) {
            updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
        }

        const normalizedUpdateSubId = updateUserDto.subdireccion_id === '' ? null : updateUserDto.subdireccion_id;
        const normalizedUpdateAreaId = updateUserDto.area_id === '' ? null : updateUserDto.area_id;

        const targetUserTypeId = updateUserDto.user_type_id || existing.user_type_id;
        const userType = await this.prisma.user_types.findUnique({
            where: { id: targetUserTypeId }
        });

        if (!userType) {
            throw new BadRequestException('Tipo de usuario no encontrado');
        }

        if (userType.name === 'admin_subdireccion') {
            const subId = normalizedUpdateSubId ?? existing.subdireccion_id;
            if (!subId) {
                throw new BadRequestException('Debe seleccionar una subdirección');
            }
        }

        const targetAreaId = normalizedUpdateAreaId !== undefined ? normalizedUpdateAreaId : existing.area_id;
        const area = targetAreaId
            ? await this.prisma.areas.findUnique({
                where: { id: targetAreaId },
                select: { subdireccion_id: true }
            })
            : null;

        if (targetAreaId && !area) {
            throw new BadRequestException('Área no encontrada');
        }

        const user = await this.prisma.users.update({
            where: {
                id
            },
            data: {
                ...updateUserDto,
                area_id: normalizedUpdateAreaId,
                subdireccion_id: userType.name === 'admin_subdireccion'
                    ? (normalizedUpdateSubId ?? existing.subdireccion_id)
                    : (area?.subdireccion_id ?? null),
            },
        });

        const { password, ...result } = user;

        return result;
    }

    async remove(id: string) {
        await this.findOne(id);

        return await this.prisma.users.delete({
            where: {
                id
            },
        });
    }
    async deactivate(id: string) {
        await this.findOne(id);

        return await this.prisma.users.update({
            where: { id },
            data: { is_active: false },
        });
    }

    async activate(id: string) {
        await this.findOne(id);

        return await this.prisma.users.update({
            where: { id },
            data: { is_active: true },
        });
    }
}
