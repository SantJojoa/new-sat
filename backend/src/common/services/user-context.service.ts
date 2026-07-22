import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { users } from '@prisma/client';

@Injectable()
export class UserContextService {
    constructor(private prisma: PrismaService) { }

    async getUserType(user: users) {
        return this.prisma.user_types.findUnique({ where: { id: user.user_type_id } });
    }

    async getUserSubdireccionId(user: users): Promise<string | null> {
        if (user.subdireccion_id) return user.subdireccion_id;
        if (!user.area_id) return null;
        const userArea = await this.prisma.areas.findUnique({
            where: { id: user.area_id },
            select: { subdireccion_id: true }
        });
        return userArea?.subdireccion_id || null;
    }
}
