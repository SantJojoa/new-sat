import api from './api';
import type { IvcRecord, CreateIvcPayload } from '../types/ivc';

export const ivcService = {
    getCatalogos: async () => {
        const response = await api.get('/ivc/catalogos');
        return response.data;
    },

    create: async (data: CreateIvcPayload): Promise<IvcRecord> => {
        const response = await api.post<IvcRecord>('/ivc', data);
        return response.data;
    },

    getAll: async (viewAll: boolean = false): Promise<IvcRecord[]> => {
        const response = await api.get<IvcRecord[]>('/ivc', { params: { viewAll } });
        return response.data;
    },

    getById: async (id: string): Promise<IvcRecord> => {
        const response = await api.get<IvcRecord>(`/ivc/${id}`);
        return response.data;
    },

    update: async (id: string, data: Partial<CreateIvcPayload>): Promise<IvcRecord> => {
        const response = await api.patch<IvcRecord>(`/ivc/${id}`, data);
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/ivc/${id}`);
    },
};
