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

    previewCertificado: async (id: string): Promise<string> => {
        const response = await api.get<string>(`/asesorias/${id}/certificado/preview`, {
            responseType: 'text',
            headers: { Accept: 'text/html' },
        });
        return response.data;
    },

    generateCertificado: async (id: string, codigo: string): Promise<void> => {
        const response = await api.get(`/asesorias/${id}/certificado`, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([response.data as BlobPart], { type: 'application/pdf' }));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `certificado-${codigo}.pdf`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    },
};
