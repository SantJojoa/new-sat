import api from './api';
import type { CreateAsesoriaPayload, AsesoriaRecord, AsesoriasCatalogosResponse } from '../types/asesorias';

export const asesoriasService = {
    getCatalogos: async (): Promise<AsesoriasCatalogosResponse> => {
        const response = await api.get<AsesoriasCatalogosResponse>('/asesorias/catalogos');
        return response.data;
    },

    createAsesoria: async (data: CreateAsesoriaPayload): Promise<AsesoriaRecord> => {
        const response = await api.post<AsesoriaRecord>('/asesorias', data);
        return response.data;
    },

    getAsesorias: async (viewAll = false): Promise<AsesoriaRecord[]> => {
        const response = await api.get<AsesoriaRecord[]>('/asesorias', { params: { viewAll } });
        return response.data;
    },
    getAsesoriaById: async (id: string): Promise<AsesoriaRecord> => {
        const response = await api.get<AsesoriaRecord>(`/asesorias/${id}`);
        return response.data;
    },
    updateAsesoria: async (id: string, data: Partial<CreateAsesoriaPayload>): Promise<AsesoriaRecord> => {
        const response = await api.patch<AsesoriaRecord>(`/asesorias/${id}`, data);
        return response.data;
    },
    deleteAsesoria: async (id: string): Promise<void> => {
        await api.delete(`/asesorias/${id}`);
    },
};
