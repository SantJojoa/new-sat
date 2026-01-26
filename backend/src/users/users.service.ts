import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }


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

        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);


        const user = await this.prisma.users.create({
            data: {
                ...createUserDto,
                password: hashedPassword
            },
        });

        const { password, ...result } = user;

        return result;
    }

    async findAll() {
        const users = await this.prisma.users.findMany({
            include: {
                areas: true,
                user_types: true
            },
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
            include: {
                areas: true,
                user_types: true
            },
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
            include: {
                areas: true,
                user_types: true
            },
        });
    }

    async findByEmail(email: string) {
        return await this.prisma.users.findUnique({
            where: {
                email
            },
            include: {
                areas: true,
                user_types: true
            },
        });
    }


    async update(id: string, updateUserDto: UpdateUserDto) {

        await this.findOne(id);

        if (updateUserDto.password) {
            updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
        }

        const user = await this.prisma.users.update({
            where: {
                id
            },
            data: updateUserDto,
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