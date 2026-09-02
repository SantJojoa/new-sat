import api from './api';
import type { Aviso, ActiveAviso } from '../types/avisos';

export const avisosService = {
    getAll: async (): Promise<Aviso[]> => {
        const response = await api.get<Aviso[]>('/avisos');
        return response.data;
    },

    getActive: async (): Promise<ActiveAviso[]> => {
        const response = await api.get<ActiveAviso[]>('/avisos/active');
        return response.data;
    },

    create: async (data: { titulo: string; mensaje: string }): Promise<Aviso> => {
        const response = await api.post<Aviso>('/avisos', data);
        return response.data;
    },

    update: async (id: string, data: { titulo?: string; mensaje?: string; is_active?: boolean }): Promise<Aviso> => {
        const response = await api.patch<Aviso>(`/avisos/${id}`, data);
        return response.data;
    },

    remove: async (id: string): Promise<void> => {
        await api.delete(`/avisos/${id}`);
    },
};
