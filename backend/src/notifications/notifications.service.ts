import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
    constructor(private readonly prisma: PrismaService) { }

    async createForUser(userId: string, type: string, title: string, message: string, link?: string) {
        return this.prisma.notifications.create({
            data: { user_id: userId, type, title, message, link }
        });
    }

    async createForMany(userIds: string[], type: string, title: string, message: string, link?: string) {
        return this.prisma.notifications.createMany({
            data: userIds.map(user_id => ({ user_id, type, title, message, link }))
        });
    }

    async findAllForUser(userId: string) {
        return this.prisma.notifications.findMany({
            where: { user_id: userId },
            orderBy: { created_at: 'desc' },
            take: 50
        });
    }

    async getUnreadCount(userId: string) {
        return this.prisma.notifications.count({
            where: { user_id: userId, read: false }
        });
    }

    async markAsRead(id: string, userId: string) {
        return this.prisma.notifications.updateMany({
            where: { id, user_id: userId },
            data: { read: true }
        });
    }

    async markAllAsRead(userId: string) {
        return this.prisma.notifications.updateMany({
            where: { user_id: userId, read: false },
            data: { read: true }
        });
    }

    async deleteRead(id: string, userId: string) {
        return this.prisma.notifications.deleteMany({
            where: { id, user_id: userId, read: true }
        });
    }

    async findAdminsBySubdireccion(subdireccionId: string): Promise<string[]> {
        const admins = await this.prisma.users.findMany({
            where: {
                is_active: true,
                user_types: { name: { in: ['admin_subdireccion', 'superadmin'] } },
                OR: [
                    { subdireccion_id: subdireccionId },
                    { areas: { subdireccion_id: subdireccionId } },
                    { user_types: { name: 'superadmin' } }
                ]
            },
            select: { id: true }
        });
        return admins.map(a => a.id);
    }
}
