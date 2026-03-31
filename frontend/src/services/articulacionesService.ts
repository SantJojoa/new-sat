import api from './api';
import type { ArticulacionRecord, ArticulacionCatalogosResponse, CreateArticulacionPayload } from '../types/articulaciones';

export const articulacionesService = {
    getCatalogos: async (): Promise<ArticulacionCatalogosResponse> => {
        const response = await api.get<ArticulacionCatalogosResponse>('/articulaciones/catalogos');
        return response.data;
    },

    create: async (data: CreateArticulacionPayload): Promise<ArticulacionRecord> => {
        const response = await api.post<ArticulacionRecord>('/articulaciones', data);
        return response.data;
    },

    getAll: async (viewAll: boolean = false): Promise<ArticulacionRecord[]> => {
        const response = await api.get<ArticulacionRecord[]>('/articulaciones', { params: { viewAll } });
        return response.data;
    },

    getById: async (id: string): Promise<ArticulacionRecord> => {
        const response = await api.get<ArticulacionRecord>(`/articulaciones/${id}`);
        return response.data;
    },

    update: async (id: string, data: Partial<CreateArticulacionPayload>): Promise<ArticulacionRecord> => {
        const response = await api.patch<ArticulacionRecord>(`/articulaciones/${id}`, data);
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/articulaciones/${id}`);
    },
};
