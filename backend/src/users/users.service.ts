import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UsersService {
    constructor(private readonly prisma: PrismaService) { }

    findAll() {
        return this.prisma.users.findMany({
            include: {
                user_types: true,
                areas: true
            }
        })
    }

    findById(id: string) {
        return this.prisma.users.findUnique({
            where: { id },
            include: {
                user_types: true,
                areas: true,
            },
        })
    }


    findByUsername(username: string) {
        return this.prisma.users.findUnique({
            where: { username },
            include: { user_types: true },
        })
    }

    create(data: any) {
        return this.prisma.users.create({
            data: {
                ...data,
                created_at: new Date(),
                updated_at: new Date(),
            },
        })
    }

    update(id: string, data: any) {
        return this.prisma.users.update({
            where: { id },
            data: {
                ...data,
                updated_at: new Date(),
            },
        })
    }

}
