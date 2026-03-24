import { api as apiClient } from '../api/client';

export interface AppNotification {
    id: string;
    type: string;
    title: string;
    message: string;
    read: boolean;
    link?: string;
    created_at: string;
}

const notificationsService = {
    getAll: async (): Promise<AppNotification[]> => {
        const res = await apiClient.get('/notifications');
        return res.data;
    },
    getUnreadCount: async (): Promise<number> => {
        const res = await apiClient.get('/notifications/unread-count');
        return typeof res.data === 'number' ? res.data : 0;
    },
    markAsRead: async (id: string): Promise<void> => {
        await apiClient.patch(`/notifications/${id}/read`);
    },
    markAllAsRead: async (): Promise<void> => {
        await apiClient.patch('/notifications/mark-all-read');
    },
    deleteRead: async (id: string): Promise<void> => {
        await apiClient.delete(`/notifications/${id}`);
    },
};

export { notificationsService };
