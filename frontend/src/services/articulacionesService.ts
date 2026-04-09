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

    downloadExcel: async (startDate?: string, endDate?: string, areaId?: string, estado?: string) => {
        const params: Record<string, string> = {};
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        if (areaId) params.area_id = areaId;
        if (estado) params.estado = estado;
        const response = await api.get('/articulaciones/estadisticas/excel', { params, responseType: 'blob' });
        const cd = response.headers['content-disposition'] as string | undefined;
        const match = cd && /filename="([^"]+)"/i.exec(cd);
        return { blob: response.data as Blob, filename: match?.[1] ?? 'Reporte_Articulaciones.xlsx' };
    },

    downloadPdf: async (startDate?: string, endDate?: string, areaId?: string, estado?: string) => {
        const params: Record<string, string> = {};
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        if (areaId) params.area_id = areaId;
        if (estado) params.estado = estado;
        const response = await api.get('/articulaciones/estadisticas/pdf', { params, responseType: 'blob' });
        const cd = response.headers['content-disposition'] as string | undefined;
        const match = cd && /filename="([^"]+)"/i.exec(cd);
        return { blob: response.data as Blob, filename: match?.[1] ?? 'Reporte_Articulaciones.pdf' };
    },

    getEstadisticas: async (startDate?: string, endDate?: string, areaId?: string, estado?: string) => {
        const params: Record<string, string> = {};
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        if (areaId) params.area_id = areaId;
        if (estado) params.estado = estado;
        const response = await api.get('/articulaciones/estadisticas', { params });
        return response.data as { total: number; estados: { name: string; count: number }[]; topSolicitantes: { name: string; count: number }[]; areas: { name: string; count: number }[] };
    },
};
